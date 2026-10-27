# 🖥️ StellarPOS Surface - Frontend Application

Modern, intuitive point-of-sale frontend application built with React, TypeScript, and Stellar blockchain integration for seamless payment processing.

## Overview

StellarPOS Surface is the user-facing frontend application that provides merchants with an intuitive interface to manage sales, process payments via Stellar blockchain, and handle business operations efficiently.

## Features

### 💳 Payment Processing
- **Stellar Payments**: Accept XLM and custom tokens
- **Multi-Currency Support**: Handle various Stellar assets
- **Real-time Exchange Rates**: Live conversion rates
- **QR Code Payments**: Generate payment QRs for customers
- **Payment Verification**: Instant blockchain confirmation

### 🛍️ Sales Management
- **Product Catalog**: Manage inventory and pricing
- **Shopping Cart**: Add/remove items with calculations
- **Receipt Generation**: Digital and printable receipts
- **Transaction History**: Complete sales tracking
- **Refund Processing**: Handle returns and refunds

### 📊 Business Analytics
- **Sales Dashboard**: Real-time sales metrics
- **Revenue Tracking**: Daily/weekly/monthly reports
- **Customer Analytics**: Purchase patterns and insights
- **Inventory Reports**: Stock levels and alerts
- **Performance KPIs**: Business health indicators

### 👥 User Management
- **Multi-user Support**: Staff accounts and permissions
- **Role-based Access**: Admin, cashier, manager roles
- **Activity Logging**: User action audit trail
- **Profile Management**: User settings and preferences

## 🛠️ Technology Stack

- **Frontend Framework**: React 18 with TypeScript
- **Styling**: TailwindCSS + Headless UI components
- **State Management**: Zustand for global state
- **Routing**: React Router v6
- **Forms**: React Hook Form + Zod validation
- **API Client**: TanStack Query (React Query)
- **Stellar Integration**: @stellar/stellar-sdk
- **UI Components**: Custom component library
- **Build Tool**: Vite for fast development
- **Testing**: Vitest + React Testing Library
- **Linting**: ESLint + Prettier

## 🏗️ Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # Base UI components (buttons, inputs, etc.)
│   ├── forms/           # Form components
│   ├── layout/          # Layout components (header, sidebar, etc.)
│   └── features/        # Feature-specific components
├── pages/               # Application pages/routes
│   ├── dashboard/       # Dashboard and analytics
│   ├── pos/            # Point of sale interface
│   ├── inventory/       # Product and inventory management
│   ├── transactions/    # Transaction history and management
│   ├── customers/       # Customer management
│   ├── settings/        # Application settings
│   └── auth/           # Authentication pages
├── hooks/              # Custom React hooks
├── services/           # API services and external integrations
│   ├── api/            # Backend API client
│   ├── stellar/        # Stellar blockchain integration
│   └── storage/        # Local storage utilities
├── stores/             # Zustand state stores
├── types/              # TypeScript type definitions
├── utils/              # Utility functions and helpers
├── constants/          # Application constants
├── styles/             # Global styles and Tailwind config
└── assets/             # Static assets (images, icons, etc.)
```


### Prerequisites
- Node.js 18+ and npm/yarn
- Git for version control

### Installation

```bash
# Clone the repository
git clone https://github.com/StellarPOS-App/surface.git
cd surface

# Install dependencies
npm install

# Start development server
npm run dev

# Open browser at http://localhost:5173
```

### Environment Setup

```bash
# Copy environment template
cp .env.example .env.local

# Configure environment variables
VITE_API_BASE_URL=http://localhost:3000/api
VITE_STELLAR_NETWORK=testnet
VITE_STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
```

## 📱 Key Pages & Features

### POS Terminal
- **Quick Sale Interface**: Fast product selection and checkout
- **Payment Processing**: Stellar payment integration
- **Receipt Generation**: Instant digital receipts
- **Customer Display**: Secondary screen support

### Dashboard
- **Sales Overview**: Today's sales, revenue, transactions
- **Quick Actions**: Fast access to common operations
- **Notifications**: Alerts and system updates
- **Performance Metrics**: Key business indicators

### Inventory Management
- **Product Catalog**: Add, edit, delete products
- **Category Management**: Organize products by categories
- **Stock Tracking**: Monitor inventory levels
- **Barcode Scanning**: Product identification support

### Transaction Management
- **Transaction History**: Complete sales record
- **Search & Filter**: Find specific transactions
- **Refund Processing**: Handle returns
- **Export Data**: Generate reports and exports

## 🔐 Security Features

- **Secure Authentication**: JWT-based auth with refresh tokens
- **Role-based Permissions**: Granular access control
- **Input Validation**: Client-side validation with Zod
- **XSS Protection**: Sanitized outputs and secure headers
- **HTTPS Enforcement**: Secure communications

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e
```

## 🏗️ Build & Deployment

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Format code
npm run format
```

## 📚 Documentation

- [Component Library](./docs/components.md)
- [API Integration](./docs/api.md)
- [Stellar Integration](./docs/stellar.md)
- [Theming Guide](./docs/theming.md)
- [Deployment Guide](./docs/deployment.md)

## 🤝 Contributing

We welcome contributions from developers around the world! 🌍

### Quick Start
1. **⭐ Star** this repository if you find it helpful
2. **🍴 Fork** the repository to your GitHub account
3. **📥 Clone** your fork locally
4. **🌿 Create** a feature branch (`git checkout -b feature/amazing-feature`)
5. **✨ Make** your changes and add tests
6. **✅ Commit** your changes (`git commit -m 'Add some amazing feature'`)
7. **📤 Push** to your branch (`git push origin feature/amazing-feature`)
8. **🔄 Open** a Pull Request

### 👥 Our Contributors
We have an amazing community of **10+ active contributors**! See our [Contributors Guide](./CONTRIBUTORS.md) for the full list.

### 🎯 Ways to Contribute
- 🐛 **Report bugs** and issues
- 💡 **Suggest features** and improvements
- 📝 **Improve documentation**
- 🧪 **Write tests** and improve coverage
- 🎨 **Enhance UI/UX** design
- ⚡ **Optimize performance**
- 🌍 **Add translations** (i18n support)
- 🔒 **Improve security**

### 📋 Good First Issues
New to open source? Check out our [Good First Issues](https://github.com/StellarPOS-App/stellarPOS-surface/labels/good%20first%20issue) - perfect for getting started!

**Detailed Contributing Guide**: [CONTRIBUTING.md](./CONTRIBUTING.md)

### 🏆 Contributor Recognition
All contributors are recognized in our README, release notes, and contributor hall of fame!

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Backend Repository](https://github.com/StellarPOS-App/backend)
- [Smart Contracts](https://github.com/StellarPOS-App/contracts)
- [Documentation](https://docs.stellarpos.app)
- [Live Demo](https://demo.stellarpos.app)

---

Built with ❤️ for the Stellar ecosystem

<!-- fix: issue #206 - [PERF-013] Excessive use of inline styles prevents CSS optimization -->