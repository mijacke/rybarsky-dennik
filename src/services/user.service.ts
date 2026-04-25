import { User } from "../models/User";
import { hashPassword } from "../util/hash";
import { AdminUserInput } from "../validators/user.validator";

export const userService = {
  async listAll() {
    return User.findAll();
  },
  async getById(id: number) {
    return User.findById(id);
  },
  async create(input: AdminUserInput) {
    const existing = await User.findByEmail(input.email);
    if (existing) throw new Error("Email je už registrovaný.");
    if (!input.password) throw new Error("Pri vytvorení používateľa je heslo povinné.");
    const u = new User({
      name: input.name,
      email: input.email,
      password: hashPassword(input.password),
      isAdmin: input.isAdmin,
    });
    await u.save();
    return u;
  },
  async update(id: number, input: AdminUserInput) {
    const u = await User.findById(id);
    if (!u) throw new Error("Používateľ neexistuje.");
    u.name = input.name;
    u.email = input.email;
    u.isAdmin = input.isAdmin;
    if (input.password) u.password = hashPassword(input.password);
    await u.save();
    return u;
  },
  async remove(id: number) {
    await User.delete(id);
  },
};
