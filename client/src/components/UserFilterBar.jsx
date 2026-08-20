import React from 'react';
import { Search, Filter, RefreshCw } from 'lucide-react';

const UserFilterBar = ({ 
  searchTerm, 
  setSearchTerm, 
  selectedRole, 
  setSelectedRole, 
  selectedStatus, 
  setSelectedStatus,
  onReset 
}) => {
  return (
    <div className="bg-[#1e1713] border border-[#3a2e26] rounded-xl p-4 mb-6 shadow-md flex flex-col md:flex-row gap-4 justify-between items-center">
      
      <div className="relative w-full md:w-1/2">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-500/60 w-5 h-5" />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-[#120d0a] border border-[#3a2e26] rounded-lg text-amber-100 placeholder-amber-700/50 focus:outline-none focus:border-amber-500 transition-colors"
        />
      </div>

      <div className="flex flex-wrap md:flex-nowrap gap-3 w-full md:w-auto items-center">
        
        <div className="relative w-full sm:w-auto">
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full bg-[#120d0a] border border-[#3a2e26] text-amber-200 py-2 px-3 pr-8 rounded-lg focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="ALL">All Roles</option>
            <option value="ADMIN">ADMIN</option>
            <option value="MENTOR">MENTOR</option>
            <option value="STUDENT">STUDENT</option>
          </select>
        </div>

        <div className="relative w-full sm:w-auto">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full bg-[#120d0a] border border-[#3a2e26] text-amber-200 py-2 px-3 pr-8 rounded-lg focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="APPROVED">Approved</option>
            <option value="PENDING">Pending</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        <button
          onClick={onReset}
          className="flex items-center gap-1.5 px-3 py-2 bg-[#2a1f19] hover:bg-[#3a2e26] text-amber-300 rounded-lg border border-[#3a2e26] transition-all text-sm font-medium"
        >
          <RefreshCw className="w-4 h-4" />
          Reset
        </button>

      </div>
    </div>
  );
};

export default UserFilterBar;