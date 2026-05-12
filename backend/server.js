import "./src/config/config.js";

const { default: connectDB } = await import("./src/config/db.js");
const { default: app } = await import("./src/app.js");

const PORT = process.env.PORT || 3000;

await connectDB();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});