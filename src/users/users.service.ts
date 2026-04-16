import { Injectable } from "@nestjs/common";
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/users.entity.js';
import {UpdateUserDTO} from './user.dto.js';

type Sanitize = {
  id: string;
  email: string | null;
};

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findUserByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email },select: ['id', 'email', "password"] });
  }

  
  // Find user by id
  async findUserById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  // Get all users
  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async findOne(email: string): Promise<User | null> {
  return this.userRepository.findOne({
    where: { email},
  });
  }


  async createUser(userData: Partial<User>): Promise<User> {
    const user = this.userRepository.create(userData);
    return this.userRepository.save(user);
  }

  async updateUser(id: string, updateData: UpdateUserDTO): Promise<Omit<User, 'password'>> {
  const user = await this.userRepository.preload({
    id,
    ...updateData,
  });

  if (!user) {
    throw new Error('User not found');
  }

  const updatedUser = await this.userRepository.save(user);

  // Exclude password before returning
  const { password, ...userWithoutPassword } = updatedUser;
  return userWithoutPassword;
}

async searchUsersByUsername(username: string, userId?: string): Promise<Omit<User, 'password'>[]> {
  const query = this.userRepository
    .createQueryBuilder('user')
    .where('user.username LIKE :username', { username: `%${username}%` });

  if (userId) {
    query.andWhere('user.id != :userId', { userId });
  }

  const users = await query.getMany();

  return users.map(({ password, ...userWithoutPassword }) => userWithoutPassword);
}

  async getUserById(id: string): Promise<Sanitize | null> {
    const user = await this.userRepository.findOne({
    where: { id },
    select: ['id', 'email'],
  });

  if (!user) return null;

  return {
    id: user.id,
    email: user.email ?? null, 
  };
  }


}