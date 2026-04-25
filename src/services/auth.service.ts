import { User } from "../models/User";
import { hashPassword, verifyPassword } from "../util/hash";
import { RegisterInput, LoginInput } from "../validators/auth.validator";

export const authService = {
  async register(input: RegisterInput): Promise<User> {
    const existing = await User.findByEmail(input.email);
    if (existing) throw new Error("Email je už registrovaný.");
    const u = new User({
      name: input.name,
      email: input.email,
      password: hashPassword(input.password),
      isAdmin: 0,
    });
    await u.save();
    return u;
  },

  async login(input: LoginInput): Promise<User> {
    const user = await User.findByEmail(input.email);
    if (!user) throw new Error("Nesprávny email alebo heslo.");
    if (!verifyPassword(input.password, user.password)) {
      throw new Error("Nesprávny email alebo heslo.");
    }
    return user;
  },
};
