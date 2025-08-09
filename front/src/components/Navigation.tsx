import { Link, Settings, Shield, User } from "lucide-react";

const Navigation = ({ activeTab, setActiveTab }: any) => {
  return (
    <div className="flex gap-1 mb-8">
      <button
        onClick={() => setActiveTab("overview")}
        className={`flex items-center gap-2 px-6 py-3 rounded-lg ${
          activeTab === "overview"
            ? "text-white"
            : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
        }`}
        style={activeTab === "overview" ? { backgroundColor: "#00B878" } : {}}
      >
        <User size={16} />
        Overview
      </button>
      <button
        onClick={() => setActiveTab("settings")}
        className={`flex items-center gap-2 px-6 py-3 rounded-lg ${
          activeTab === "settings"
            ? "text-white"
            : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
        }`}
        style={activeTab === "settings" ? { backgroundColor: "#00B878" } : {}}
      >
        <Settings size={16} />
        Settings
      </button>
      <button
        onClick={() => setActiveTab("privacy")}
        className={`flex items-center gap-2 px-6 py-3 rounded-lg ${
          activeTab === "privacy"
            ? "text-white"
            : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
        }`}
        style={activeTab === "privacy" ? { backgroundColor: "#00B878" } : {}}
      >
        <Shield size={16} />
        Privacy
      </button>
      <button
        onClick={() => setActiveTab("account")}
        className={`flex items-center gap-2 px-6 py-3 rounded-lg ${
          activeTab === "account"
            ? "text-white"
            : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
        }`}
        style={activeTab === "account" ? { backgroundColor: "#00B878" } : {}}
      >
        <Link size={16} />
        Account
      </button>
    </div>
  );
};

export default Navigation;
