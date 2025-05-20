import { Link } from 'react-router-dom';
import {
  HomeIcon,
  FireIcon,
  ClockIcon,
  HeartIcon,
  ListBulletIcon,
} from '@heroicons/react/24/outline';

const Sidebar = () => {
  const menuItems = [
    { icon: HomeIcon, label: 'Home', path: '/' },
    { icon: FireIcon, label: 'Trending', path: '/trending' },
    { icon: ClockIcon, label: 'History', path: '/history' },
    { icon: HeartIcon, label: 'Favorites', path: '/favorites' },
    { icon: ListBulletIcon, label: 'Playlists', path: '/playlists' },
  ];

  return (
    <aside className="fixed left-0 top-14 h-[calc(100vh-3.5rem)] w-64 bg-[#0f0f0f] border-r border-[#272727] pt-4">
      <nav>
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className="flex items-center px-6 py-3 text-white hover:bg-[#272727]"
          >
            <item.icon className="h-6 w-6 mr-4" />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar; 