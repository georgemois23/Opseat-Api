import { ConflictException, HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service'
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
// import { EmailService } from 'src/email/email.service';
import { InjectRepository } from '@nestjs/typeorm';
import { User, UserRole } from '../users/entities/users.entity.js';
import { Repository } from 'typeorm';

type AuthInput = { email: string; password: string };
type SignInData = { userId: string; email: string; };
type AuthResult = { accessToken: string; refreshToken: string; userId: string};

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        // private emailService: EmailService,
        @InjectRepository(User)
            private readonly userRepository: Repository<User>,
        
    ) {}

    async authenticate(input: AuthInput): Promise<AuthResult> {
        const user = await this.validateUser(input);
        if (!user) {
            throw new UnauthorizedException();
        }
        console.log(`Found user with email: ${user.email}`);
        return this.signIn(user);
    }

    async validateUser(input: AuthInput): Promise<SignInData | null> {
        const user = await this.usersService.findUserByEmail(input.email);
        if(user) console.log(`Found user with email: ${user.email}`);
        if(!user) { console.log("User not found!"); return null; }
        if (user.disabled) {
        throw new HttpException(
            { message: 'User account is disabled', code: 'USER_DISABLED' },
            HttpStatus.FORBIDDEN, // 403 makes sense for disabled account
        );
        }
        if(user.temporarily_disabled) {
        throw new HttpException(
            { message: 'User account is temporarily disabled', code: 'USER_TEMP_DISABLED' },
            HttpStatus.FORBIDDEN,
        );
        }
        const isPasswordValid = await bcrypt.compare(input.password, user.password);
        if (!isPasswordValid) return null;
            return {
                userId: user.id,
                email: user.email,
            };
        
    }

    async signIn(user: SignInData): Promise<AuthResult> {
        const payload = { email: user.email, sub: user.userId };

  const accessToken = this.jwtService.sign(payload, { expiresIn: '59m' });
  const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });
  
  return {
    accessToken: accessToken,
    refreshToken: refreshToken,
    userId: user.userId,
  };
}

   async hashPassword(plainPassword: string): Promise<string> {
    const saltRounds = 10;  
    const hashed = await bcrypt.hash(plainPassword, saltRounds);
    return hashed;
}

  // src/auth/auth.service.ts
async googleLogin(googleUser): Promise<AuthResult> { // Explicit return type
  if (!googleUser) {
    // Throwing an exception is better than returning a string in NestJS
    throw new UnauthorizedException('No user from google');
  }

  let user = await this.usersService.findUserByEmail(googleUser.email);

  if (!user) {
    user = await this.usersService.createUser({
      email: googleUser.email,
      first_name: googleUser.firstName,
      last_name: googleUser.lastName,
    });
  }

  const signInData: SignInData = {
    email: user.email,
    userId: user.id,
  };

  return this.signIn(signInData);
}

async register(input: {
        email: string;
        password: string;
        first_name: string;
        last_name: string;
    }) {
        const existingUser = await this.usersService.findUserByEmail(input.email);

          if (existingUser) {
            throw new ConflictException("Email already in use");
        }

        const hashedPassword = await bcrypt.hash(input.password, 10);

        const user = await this.usersService.createUser({
            ...input,
            password: hashedPassword,
        });

        return { message: 'User created successfully', userId: user.id };
    }

   

  async refreshToken(token: string): Promise<{ accessToken: string; newRefreshToken: string }> {
    try {
        const payload = await this.jwtService.verifyAsync(token);

        const user = await this.usersService.findUserById(payload.sub);
        if (!user) throw new UnauthorizedException();

        const accessToken = this.jwtService.sign({ sub: user.id, email: user.email }, { expiresIn: '59m' });
        const newRefreshToken = this.jwtService.sign({ sub: user.id, email: user.email }, { expiresIn: '7d' });

        return { accessToken, newRefreshToken };
    } catch (e) {
        throw new UnauthorizedException();
    }
}

 async forgotPassword(email: string) {
  const user = await this.usersService.findOne(email);
  if (!user) return;

  const token = crypto.randomUUID(); // or JWT
  user.resetToken = token;
  user.resetTokenExpiry = new Date(Date.now() + 1000 * 60 * 60); // 1 hour
  await this.userRepository.save(user);

  // if(user.email) {
  // await this.emailService.sendForgotPasswordEmail(user.email, token, user.username);
  // }
}

  async resetPassword(token: string, newPassword: string) {
  if (!token) throw new UnauthorizedException('Invalid reset token');

  const user = await this.userRepository.findOne({
    where: { resetToken: token },
  });

  if (!user) {
    throw new UnauthorizedException('Invalid reset token');
  }

  if (!user.resetTokenExpiry || user.resetTokenExpiry.getTime() < Date.now()) {
    throw new UnauthorizedException('Reset token expired');
  }

  // Hash the new password
  user.password = await this.hashPassword(newPassword);

  // Invalidate token correctly
  user.resetToken = null;
  user.resetTokenExpiry = null;

  await this.userRepository.save(user);
}


async verifyResetToken(token: string) {
    const user = await this.userRepository.findOne({
      where: { resetToken: token },
    });

    if (!user || !user.resetTokenExpiry || user.resetTokenExpiry.getTime() < Date.now()) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    return { message: 'Token is valid' };
  }



}
