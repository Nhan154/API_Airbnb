import prisma from "../config/prisma.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Đăng ký
export const signup = async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            phone,
            birthday,
            gender,
        } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Vui lòng nhập đầy đủ name, email và password",
            });
        }

        const existingUser = await prisma.nguoiDung.findUnique({
            where: { email },
        });

        if (existingUser) {
            return res.status(409).json({
                message: "Email đã được sử dụng",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.nguoiDung.create({
            data: {
                name,
                email,
                password: hashedPassword,
                phone,
                birthday,
                gender,
                role: "USER",
            },
        });

        return res.status(201).json({
            message: "Đăng ký thành công",
            data: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                phone: newUser.phone,
                birthday: newUser.birthday,
                gender: newUser.gender,
                role: newUser.role,
            },
        });
    } catch (error) {
        console.error("Signup error:", error);

        return res.status(500).json({
            message: "Lỗi server khi đăng ký",
        });
    }
};

// Đăng nhập
export const signin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Vui lòng nhập email và password",
            });
        }

        const user = await prisma.nguoiDung.findUnique({
            where: { email },
        });

        if (!user) {
            return res.status(401).json({
                message: "Email hoặc mật khẩu không chính xác",
            });
        }

        const isPasswordValid = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordValid) {
            return res.status(401).json({
                message: "Email hoặc mật khẩu không chính xác",
            });
        }

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN || "1d",
            }
        );

        return res.status(200).json({
            message: "Đăng nhập thành công",
            content: {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    birthday: user.birthday,
                    gender: user.gender,
                    role: user.role,
                },
                token,
            },
        });
    } catch (error) {
        console.error("Signin error:", error);

        return res.status(500).json({
            message: "Lỗi server khi đăng nhập",
        });
    }
};