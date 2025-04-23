import bcrypt from "bcryptjs";

// Kullanılacak şifreyi burada belirtin
const password = "admin123";

// Şifreyi hashle
const salt = bcrypt.genSaltSync(10);
const hashedPassword = bcrypt.hashSync(password, salt);

console.log("Hashlenen şifre:", hashedPassword);
