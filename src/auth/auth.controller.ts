// auth.controller.ts
import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() body: any) {
    return this.authService.register(body);
  }

  @Post('login')
  async login(@Body() body: any) {
    return this.authService.login(body);
  }

  @Post('refresh')
  async refresh(@Body() body: any) {
    // Expects { userId: "...", refresh_token: "..." } in the body
    // (Or read it from an HttpOnly cookie if you go that route)
    return this.authService.refreshTokens(body.userId, body.refresh_token);
  }

  // Example of a protected logout endpoint to clear the token from the DB
  @UseGuards(AuthGuard('jwt'))
  @Post('logout')
  async logout(@Req() req: any) {
    // Clear token logic here (set refresh_token to null in Supabase)
    return { message: 'Logged out successfully' };
  }
}
