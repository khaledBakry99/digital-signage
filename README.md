# Firasah Live - Digital Signage Management System

A comprehensive, enterprise-grade digital signage management platform for displaying advertisements and media content across multiple screens with real-time monitoring, AI-powered features, and subscription-based access control.

![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-16.2.6-black.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## 🌟 Features

### 📢 Advertisement Management
- **Multi-format Support**: Upload images (JPG, PNG, GIF, WebP) and videos (MP4, WebM, MOV)
- **Drag & Drop Interface**: Intuitive file upload with preview functionality
- **Duration Control**: Set custom display durations for images
- **Screen Assignment**: Link advertisements to specific screens (1-5)
- **CRUD Operations**: Full create, read, update, delete capabilities
- **Search & Filter**: Quick search by name and filter by screen assignment

### 📺 Screen Management
- **Multi-Screen Support**: Manage up to 5 independent display screens
- **Fullscreen Mode**: Automatic fullscreen display for immersive viewing
- **Auto-Playback**: Videos loop automatically with seamless transitions
- **Timer Display**: Visual countdown timer showing remaining display time
- **Real-time Updates**: Automatic content refresh every 5 seconds
- **Heartbeat Monitoring**: Live status tracking for each screen

### 🎯 AI-Powered Features
- **Person Detection**: MediaPipe-based person counting for audience analytics
- **Smart Screenshots**: Automatic screenshot capture when people are detected
- **Gender Recognition**: AI-powered gender detection for demographic insights
- **Real-time Processing**: Efficient on-device AI processing with minimal latency

### 🔗 Real-time Communication
- **SignalR Integration**: Real-time bidirectional communication
- **Live Updates**: Instant content synchronization across all screens
- **Camera Streaming**: Real-time camera feed monitoring
- **Event Broadcasting**: Instant notification of system events

### 👥 User Management
- **Role-Based Access Control**: SuperAdmin, Admin, and User roles
- **Authentication System**: Secure JWT-based authentication
- **Session Management**: Automatic session expiry with toast notifications
- **Password Recovery**: Forgot password and reset password functionality
- **Multi-Tenant Support**: Client-based subscription management

### 💳 Subscription System
- **Plan Management**: Create and manage subscription plans
- **Client Assignment**: Assign plans to clients with expiration tracking
- **Automatic Expiry**: System automatically handles subscription expiration
- **Usage Monitoring**: Track screen and media asset usage per client

### 🎨 Modern UI/UX
- **Full Arabic Support**: Complete RTL (Right-to-Left) interface
- **Dark/Light Theme**: Toggle between dark and light modes
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Smooth Animations**: Fluid transitions and micro-interactions
- **Glassmorphism**: Modern glass-effect design elements

## 🚀 Getting Started

### Prerequisites
- **Node.js**: 18.0 or higher
- **npm**: 9.0 or higher (or yarn)
- **Docker**: (optional, for containerized deployment)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/digital-signage.git
cd digital-signage

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# Or build manually
docker build -t digital-signage:latest .
docker run -p 3000:3000 digital-signage:latest
```

## 📖 Usage Guide

### 1. User Authentication
1. Navigate to `http://localhost:3000/login`
2. Enter your email and password
3. Click "تسجيل الدخول" (Login)
4. If you forgot your password, click "نسيت كلمة المرور؟" to reset it

### 2. Managing Advertisements
1. Go to the "الإعلانات" (Advertisements) page
2. Click "إضافة إعلان" (Add Advertisement)
3. Enter advertisement name
4. Upload media file (drag & drop or click to browse)
5. Assign to target screen(s)
6. Set display duration for images
7. Click "حفظ" (Save)

### 3. Screen Management
1. Navigate to "الشاشات" (Screens) page
2. View all screens with their current status
3. Click on a screen to view in fullscreen mode
4. Monitor real-time updates via SignalR
5. View AI detection statistics

### 4. Campaign Management
1. Go to "الحملات" (Campaigns) page
2. Create new campaigns with media slots
3. Assign advertisements to campaign slots
4. Set campaign duration and scheduling
5. Activate/deactivate campaigns

### 5. Camera Integration
1. Navigate to "الكاميرات" (Cameras) page
2. Add new cameras with configuration
3. Enable AI detection for person counting
4. View real-time camera feeds
5. Monitor screenshot captures

## 🏗️ Architecture

### Technology Stack

**Frontend Framework:**
- **Next.js 16.2.6**: React framework with App Router
- **React 19.2.4**: UI library
- **TypeScript 5.0**: Type-safe development

**Styling:**
- **Tailwind CSS 4.0**: Utility-first CSS framework
- **Custom CSS**: Glassmorphism effects and animations

**AI/ML:**
- **MediaPipe Tasks Vision**: Person detection and tracking
- **Custom AI Service**: Gender recognition and analytics

**Real-time:**
- **SignalR (@microsoft/signalr)**: Real-time WebSocket communication
- **HLS.js**: HTTP Live Streaming support

**Storage:**
- **IndexedDB**: Large file storage (images, videos)
- **LocalStorage**: Session data and user preferences

**Testing:**
- **Vitest**: Unit testing framework
- **Testing Library**: React component testing
- **fast-check**: Property-based testing

### Project Structure

```
digital-signage/
├── app/                          # Next.js App Router pages
│   ├── page.tsx                 # Dashboard/Home
│   ├── login/                   # Authentication pages
│   ├── forgot-password/         # Password recovery
│   ├── reset-password/          # Password reset
│   ├── ads/                     # Advertisement management
│   ├── campaigns/               # Campaign management
│   ├── screens/                 # Screen management
│   ├── cameras/                 # Camera integration
│   ├── media-assets/            # Media asset library
│   ├── change-password/         # Password change
│   └── super-admin/             # Admin panel
├── components/                   # React components
│   ├── AppShell.tsx            # Main layout wrapper
│   ├── AuthGuard.tsx           # Authentication guard
│   ├── SessionExpiryToast.tsx  # Session expiry notification
│   ├── ScreenPlayer.tsx        # Media playback component
│   ├── AdForm.tsx              # Advertisement form
│   ├── CampaignForm.tsx        # Campaign form
│   └── ...                     # Additional UI components
├── lib/                         # Core libraries
│   ├── api/                    # API client layer
│   │   ├── client.ts          # HTTP client with interceptors
│   │   ├── config.ts          # API endpoints configuration
│   │   ├── auth.api.ts        # Authentication API
│   │   ├── screen.api.ts      # Screen management API
│   │   ├── campaign.api.ts    # Campaign API
│   │   ├── camera.api.ts      # Camera API
│   │   └── password.api.ts    # Password recovery API
│   ├── services/              # Business logic services
│   │   ├── authService.ts    # Authentication service
│   │   ├── mediapipeService.ts # AI detection service
│   │   ├── signalRService.ts  # Real-time communication
│   │   └── cameraScreenshotService.ts # Screenshot service
│   ├── hooks/                 # Custom React hooks
│   │   ├── useAuth.ts         # Authentication hook
│   │   ├── useScreens.ts      # Screen management hook
│   │   ├── useCampaigns.ts    # Campaign management hook
│   │   └── ...                # Additional hooks
│   ├── context/               # React contexts
│   │   └── ThemeContext.tsx   # Theme management
│   └── types/                 # TypeScript type definitions
├── public/                     # Static assets
│   ├── logo-small.png         # Application logo
│   └── ...                    # Other static files
├── Dockerfile                  # Docker configuration
├── docker-compose.yml          # Docker Compose setup
├── next.config.ts              # Next.js configuration
├── tsconfig.json               # TypeScript configuration
├── tailwind.config.ts          # Tailwind CSS configuration
└── package.json                # Dependencies and scripts
```

## 🔌 API Integration

The application integrates with a backend API for:

- **Authentication**: Login, logout, password recovery
- **Screen Management**: CRUD operations for screens
- **Campaign Management**: Campaign lifecycle management
- **Camera Integration**: Camera configuration and streaming
- **Media Assets**: Media upload and management
- **Subscription Management**: Client subscription tracking
- **Super Admin**: User and client management

### API Configuration

Base URL is configured in `lib/api/config.ts`:
```typescript
API_CONFIG = {
  BASE_URL: 'https://backend-42316129731.europe-west1.run.app',
  TIMEOUT: 30000
}
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- auth.test.ts
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Session Management**: Automatic session expiry with user notification
- **Route Protection**: AuthGuard protects authenticated routes
- **Password Recovery**: Secure forgot password flow with email tokens
- **Role-Based Access**: Different access levels for different user roles
- **HTTPS Ready**: Production deployment supports SSL/TLS

## 📊 Monitoring & Analytics

- **Screen Heartbeat**: Real-time screen status monitoring
- **AI Detection**: Person counting and gender recognition analytics
- **Screenshot Capture**: Automatic capture when people detected
- **Usage Tracking**: Track media asset usage per client
- **Subscription Monitoring**: Track subscription expiry and renewals

## 🎨 Customization

### Theme Configuration
The application supports dark/light themes with automatic detection and manual toggle. Theme is stored in localStorage for persistence.

### API Configuration
Modify `lib/api/config.ts` to change:
- Backend API URL
- Request timeout
- Default headers

### AI Detection Settings
Configure AI detection parameters in `lib/services/mediapipeService.ts`:
- Detection confidence threshold
- Bounding box area ratio
- Person counting logic

## 🚢 Deployment

### Vercel Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Docker Deployment
```bash
# Build image
docker build -t digital-signage:latest .

# Run container
docker run -p 3000:3000 digital-signage:latest
```

### Environment Variables
Create `.env.local` for local development:
```env
NEXT_PUBLIC_API_URL=https://your-api-url.com
NODE_ENV=production
```

## 📝 Development Guidelines

### Code Standards
- Use TypeScript for all new files
- Follow ESLint configuration
- Write meaningful commit messages
- Add comments for complex logic
- Use Arabic comments for user-facing text

### Component Structure
```typescript
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ComponentName() {
  // State
  const [state, setState] = useState(initialValue);

  // Effects
  useEffect(() => {
    // Effect logic
  }, []);

  // Handlers
  const handleAction = () => {
    // Handler logic
  };

  // Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Workflow
1. Write tests for new features
2. Ensure all tests pass
3. Update documentation
4. Submit PR with clear description

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- MediaPipe team for AI/ML tools
- Tailwind CSS for the utility-first CSS framework
- SignalR team for real-time communication

## 📞 Support

For support, email support@firasah.com or open an issue in the repository.

---

**Built with ❤️ by Firasah Team**


