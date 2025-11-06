const app = require('./api/index');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Teams API is running on http://localhost:${PORT}`);
  console.log(`📝 Endpoints available:`);
  console.log(`   GET    http://localhost:${PORT}/api/v1/teams`);
  console.log(`   POST   http://localhost:${PORT}/api/v1/teams`);
  console.log(`   PUT    http://localhost:${PORT}/api/v1/teams?id=TEAM_ID`);
  console.log(`   GET    http://localhost:${PORT}/api/health`);
});
