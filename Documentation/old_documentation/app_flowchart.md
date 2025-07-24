flowchart TD
  A[Landing Page] --> B[Sign Up Auth]
  B --> C[Tournament Intro]
  C --> D[Prediction Interface]
  D --> E{Prediction Window Open?}
  E -->|Yes| F[Select Top8 Players]
  E -->|No| G[Submission Closed]
  F --> H[Submit Prediction]
  H --> I[Show Confirmation]
  I --> J[Go to Leaderboard]
  J --> K[Leaderboard Display]
  C --> L[Admin Interface]
  L --> M[Enter Tournament Results]
  M --> N[Compute Scores]
  N --> K