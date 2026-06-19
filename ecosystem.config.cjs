module.exports = {
  apps: [
    {
      name: "boubane-dashboard",
      script: "dist/server.cjs",
      cwd: "/home/ubuntu/Boubane-Dashboard",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: "3000"
      },
      env_production: {
        NODE_ENV: "production",
        PORT: "3000"
      },
      restart_delay: 5000,
      max_restarts: 10,
      watch: false
    }
  ]
};
