import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AuthService } from './auth/auth.service';

async function bootstrap() {
  // 1. Create the application context (runs without starting the HTTP listener)
  const app = await NestFactory.createApplicationContext(AppModule);

  // 2. Retrieve your UsersService from the context
  const authService = app.get(AuthService);

  console.log('Starting database seeding...');

  // 3. Define your mock data
  const seedUsers = [
    {
      email: 'admin@example.com',
      password: 'SuperSecurePassword123!', // Remember to hash this in your service if needed
      name: 'Admin User',
      role: 'admin',
    },
    {
      email: 'john@example.com',
      password: 'Password123!',
      name: 'John Doe',
      role: 'user',
    },
  ];

  // 4. Iterate and insert data safely
  for (const user of seedUsers) {
    try {
      // Optional: Check if user already exists to prevent duplicate key errors
      await authService.register({
        email: user.email,
        password: user.password,
        role: user.role,
      });
    } catch (error) {
      console.error(`Failed to create user ${user.email}:`, error.message);
    }
  }

  console.log('Seeding completed successfully!');

  // 5. Close the application context
  await app.close();
}

bootstrap().catch((error) => {
  console.error('Seeding initialization failed:', error);
  process.exit(1);
});
