# HackNest 

A comprehensive ethical hacking toolkit with a modern web interface for penetration testing, reconnaissance, and security assessment.

##  Features

### Backend Modules
- **Reconnaissance**: Port scanning, service detection, and network mapping
- **Web Security**: Nikto, WhatWeb, Dirb, and HTTP headers analysis
- **Exploitation**: Vulnerability scanning and exploitation tools
- **Reports**: Comprehensive scan history and export functionality

### Frontend Interface
- **Dark Cyber Theme**: Modern, professional UI with dark mode
- **Real-time Results**: Live updates during scans
- **Responsive Design**: Works on desktop and mobile devices
- **Interactive Forms**: User-friendly input validation
- **Results Visualization**: Clean display of scan results

##  Tech Stack

### Backend
- **Node.js** with Express.js
- **Socket.io** for real-time communication
- **Security tools integration** (Nikto, WhatWeb, Dirb, Nmap)

### Frontend
- **React 18** with Vite
- **Tailwind CSS** for styling
- **Socket.io-client** for real-time updates
- **React Router** for navigation

##  Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Git

### Setup

1. **Clone the repository**
   \\\ash
   git clone https://github.com/yourusername/hacknest.git
   cd hacknest
   \\\

2. **Install backend dependencies**
   \\\ash
   cd backend
   npm install
   \\\

3. **Install frontend dependencies**
   \\\ash
   cd ../frontend
   npm install
   \\\

##  Running the Application

### Development Mode

1. **Start the backend server**
   \\\ash
   cd backend
   npm start
   \\\
   Backend will run on \http://localhost:3000\

2. **Start the frontend development server**
   \\\ash
   cd frontend
   npm run dev
   \\\
   Frontend will run on \http://localhost:5173\

### Production Mode

1. **Build the frontend**
   \\\ash
   cd frontend
   npm run build
   \\\

2. **Start production server**
   \\\ash
   cd backend
   npm start
   \\\

##  Usage

1. Open your browser and navigate to \http://localhost:5173\
2. Use the navigation menu to access different modules:
   - **Reconnaissance**: Network scanning and port discovery
   - **Web Security**: Web application security testing
   - **Exploitation**: Vulnerability assessment
   - **Reports**: View and export scan results

##  Configuration

### Backend Configuration
Edit \ackend/server.js\ to modify:
- Server port
- CORS settings
- Security tool paths

### Frontend Configuration
Edit \rontend/vite.config.js\ to modify:
- Development server settings
- Build configuration

##  Project Structure

\\\
hacknest/
 backend/
    routes/
       recon.js
       exploit.js
       reports.js
       websecurity.js
    utils/
       parser.js
       storage.js
    package.json
    server.js
 frontend/
    src/
       components/
       pages/
       utils/
       App.jsx
       main.jsx
    package.json
    index.html
 README.md
\\\

##  Security Notice

 **Important**: This tool is designed for ethical hacking and security testing only. Always ensure you have proper authorization before testing any systems or networks. The developers are not responsible for any misuse of this software.

##  Contributing

1. Fork the repository
2. Create a feature branch (\git checkout -b feature/amazing-feature\)
3. Commit your changes (\git commit -m 'Add some amazing feature'\)
4. Push to the branch (\git push origin feature/amazing-feature\)
5. Open a Pull Request

##  License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

##  Acknowledgments

- Built with modern web technologies
- Inspired by ethical hacking practices
- Designed for security professionals and researchers

##  Support

If you encounter any issues or have questions, please open an issue on GitHub.

---

**Happy Hacking! **
