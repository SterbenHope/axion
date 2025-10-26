module.exports = {
	plugins: {
		tailwindcss: {},
		autoprefixer: {},
	},
}

module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    ...(process.env.NODE_ENV === 'production' ? { cssnano: {} } : {}),
  },
}
