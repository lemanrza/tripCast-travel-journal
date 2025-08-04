require("dotenv").config()

module.exports = {
    PORT: process.env.PORT || 5000,
    DB_URL: process.env.DB_URL,
    DB_USERNAME: process.env.DB_USERNAME,
    DB_PASSWORD: process.env.DB_PASSWORD
}