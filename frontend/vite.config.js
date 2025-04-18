export default {
  server: {
    proxy: {
      "/api": {
        target: "https://corn-complement-slides-democrat.trycloudflare.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
};