// src/pages/misc/NotFoundPage.tsx

import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Home } from "lucide-react";

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-gray-50 px-6">
      <div className="text-center max-w-xl">

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img
            src="/logo_minalgems.png"
            alt="Minal Gems"
            className="h-14"
          />
        </div>

        {/* 404 */}
        <h1 className="text-7xl font-bold text-gray-800 mb-2">
          404
        </h1>

        {/* Title */}
        <h2 className="text-2xl font-semibold text-gray-700 mb-3">
          Page Not Found
        </h2>

        {/* Message */}
        <p className="text-gray-500 mb-8">
          The page you are looking for does not exist or has been moved.
        </p>

        {/* Buttons */}
        <div className="flex justify-center gap-4 flex-wrap">

          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-5 py-2 rounded-lg border hover:bg-gray-100 transition"
          >
            <ArrowLeft size={18} />
            Go Back
          </button>

          <button
            onClick={() => navigate("/admin")}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            <Home size={18} />
            Dashboard
          </button>

        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;