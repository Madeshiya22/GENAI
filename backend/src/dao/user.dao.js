import userModel from "../models/user.model.js";

// FIND USER BY EMAIL
export async function findUserByEmail(email) {
  return await userModel.findOne({
    email,
  });
}

// CREATE USER
export async function createUser(data) {
  return await userModel.create(data);
}

// FIND USER BY ID
export async function findUserById(id) {
  return await userModel.findById(id);
}
