module.exports = {
  apps: [
    {
      name: "stokku",
      cwd: "/root/stokku",
      script: "npm",
      args: "run start -- -p 3000 -H 0.0.0.0",
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      env: { NODE_ENV: "production" },
    },
  ],
};
