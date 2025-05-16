# Vitharith - AI-Powered Quiz Platform for Educators

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20Site-brightgreen)](https://vidharith.vercel.app/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2.28-000000?logo=next.js)](https://nextjs.org/)
[![Convex](https://img.shields.io/badge/Convex-1.23.0-0072F5)](https://www.convex.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0.0-3178C6?logo=typescript)](https://www.typescriptlang.org/)

Vitharith is a modern, AI-powered quiz platform designed to help educators gain real-time insights into student comprehension. The platform enables teachers to create, distribute, and analyze quizzes with powerful AI-assisted features.

🔗 **Live Demo:** [https://vidharith.vercel.app/](https://vidharith.vercel.app/)

## 🚀 Features

### For Educators
- **Interactive Quiz Creation**: Build custom quizzes with various question types
- **Real-time Analytics Dashboard**: Monitor student responses as they happen
- **AI-Powered Question Generation**: Automatically generate questions from uploaded materials
- **Comprehensive Student Insights**:
  - Individual student performance analysis
  - Class-wide performance metrics
  - Topic-wise strength and weakness identification
- **Material Management**: Upload and organize teaching materials in one place

### Technical Highlights
- **Real-time Data Sync**: Instant updates across all devices
- **AI Integration**: Leverages Google's Generative AI for question generation
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Secure Authentication**: Built with Clerk for secure user management

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **UI Components**: Radix UI Primitives and Shadcn UI
- **Styling**: Tailwind CSS with custom theming
- **State Management**: React Hooks + Convex
- **Form Handling**: React Hook Form with Zod validation
- **Charts & Visualizations**: Recharts

### Backend
- **Database & Real-time Sync**: Convex
- **Authentication**: Clerk
- **AI/ML**: Google Generative AI
- **API Routes**: Next.js API Routes

### Development Tools
- **Type Safety**: TypeScript
- **Code Formatting**: ESLint + Prettier
- **Version Control**: Git
- **Package Manager**: npm

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Convex account
- Google Cloud account (for AI features)

### Installation
1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/vitharith.git
   cd vitharith
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   yarn
   ```

3. Set up Convex
   ```bash
   # Install Convex CLI globally if you haven't already
   npm install -g convex
   
   # Log in to Convex
   npx convex init
   
   # Push your schema and functions to Convex
   npx convex dev
   ```

4. Set up environment variables
   Create a `.env.local` file in the root directory and add the following variables:
   
   ```env
   # Convex
   CONVEX_DEPLOYMENT=your_convex_deployment
   NEXT_PUBLIC_CONVEX_URL=your_convex_url  # Get this from Convex dashboard after setup
   
   # Clerk Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   
   # Google AI
   GOOGLE_AI_KEY=your_google_ai_key
   
   # Application
   NEXT_PUBLIC_WEBSITE_URL=http://localhost:3000
   ```
   
   After running `npx convex dev`, it will provide you with the `NEXT_PUBLIC_CONVEX_URL` that you need to add to your environment variables.

4. Run the development server
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## 📊 Features in Action

### Quiz Creation
![Quiz Creation Demo](/public/readme/quiz-creation.gif)

### Real-time Analytics
![Analytics Dashboard](/public/readme/analytics.png)

### AI Question Generation
![AI Question Generation](/public/readme/ai-question.png)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 📧 Contact

K. Sai Rithvik Reddy - [@DSToday1](https://x.com/DSToday1) - rithvikreddy524@gmail.com

Project Link: [https://github.com/Rithvik119am/VidhaRith](https://github.com/Rithvik119am/VidhaRith)

## 🙏 Acknowledgments

- [Next.js Documentation](https://nextjs.org/docs)
- [Convex Documentation](https://docs.convex.dev/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Radix UI](https://www.radix-ui.com/)
- [Shadcn UI](https://ui.shadcn.com/)
