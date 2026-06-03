// jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'YOUR_SUPER_SECRET_KEY',
    });
  }

  // This payload is the decoded JWT
  validate(payload: any) {
    // You can fetch full user details from the DB here if needed
    // e.g., const user = await this.usersService.findOne(payload.sub);

    return { userId: payload.sub, username: payload.username };
  }
}
