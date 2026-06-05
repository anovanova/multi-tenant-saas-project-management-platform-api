// auth.service.ts
import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SupabaseService } from '../supabase/supabase.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private supabaseService: SupabaseService,
    private jwtService: JwtService,
  ) {}

  // 1. Register a new user
  async register(body: any) {
    const { email, password, role } = body;

    // Check if user already exists
    const { data: existingUser } = await this.supabaseService.client
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash password and store user
    const passwordHash = await bcrypt.hash(password, 10);
    const { data, error } = await this.supabaseService.client
      .from('users')
      .insert([{ email, password_hash: passwordHash, role }])
      .select()
      .single();

    if (error) throw new UnauthorizedException('Registration failed');

    return this.generateTokens(data.id, data.email);
  }

  // 2. Validate user for Login
  async login(body: any) {
    const { email, password } = body;

    const { data: user, error } = await this.supabaseService.client
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(user.id, user.email);
  }

  // 3. Refresh the Access Token using a valid Refresh Token
  async refreshTokens(userId: string, refreshToken: string) {
    const { data: user } = await this.supabaseService.client
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (!user || !user.refresh_token) {
      throw new UnauthorizedException('Access Denied');
    }

    // Verify the incoming refresh token against the hashed token in DB
    const tokenMatches = await bcrypt.compare(refreshToken, user.refresh_token);
    if (!tokenMatches) {
      throw new UnauthorizedException('Invalid Refresh Token');
    }

    return this.generateTokens(user.id, user.email);
  }

  // Helper: Generate pairs and save the hashed refresh token to Supabase
  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, { expiresIn: '15m' }),
      this.jwtService.signAsync(payload, { expiresIn: '7d' }),
    ]);

    // Hash the refresh token before saving it to the database
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.supabaseService.client
      .from('users')
      .update({ refresh_token: hashedRefreshToken })
      .eq('id', userId);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }
}
