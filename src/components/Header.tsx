import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const Header = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 flex items-center px-4 z-50">
      <div className="flex items-center flex-1">
        <Link to="/" className="ml-2">
          <h1 className="text-2xl font-bold text-black">Focus</h1>
        </Link>
      </div>

      <form onSubmit={handleSearch} className="flex items-center flex-[0.5]">
        <div className="flex w-full">
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-100 text-black px-4 py-2 rounded-l-full border border-gray-300 focus:outline-none focus:border-blue-500"
          />
          <button 
            type="submit"
            className="bg-gray-200 px-6 rounded-r-full border border-l-0 border-gray-300"
          >
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-700" />
          </button>
        </div>
      </form>
    </header>
  );
};

export default Header; 