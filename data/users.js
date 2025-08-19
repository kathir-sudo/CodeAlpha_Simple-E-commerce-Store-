import bcrypt from 'bcryptjs';

const users = [
  {
    username: 'Admin User',
    email: 'admin@example.com',
    password: 'password123',
    isAdmin: true,
  },
  {
    username: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
  },
  {
    username: 'Jane Doe',
    email: 'jane@example.com',
    password: 'password123',
  },
];

const hashedUsers = users.map(user => {
  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(user.password, salt);
  return { ...user, password: hashedPassword };
});


export default hashedUsers;