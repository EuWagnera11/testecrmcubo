import { Link } from 'react-router-dom';
import refineLogo from '@/assets/refine-logo.png';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  linkTo?: string;
}

export function Logo({ size = 'md', linkTo = '/dashboard' }: LogoProps) {
  const sizeClasses = {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-10',
  };

  const content = (
    <img 
      src={refineLogo}
      alt="Refine"
      className={`${sizeClasses[size]} w-auto transition-opacity duration-300 hover:opacity-80 dark:invert`}
      style={{ filter: 'brightness(0)' }}
    />
  );

  if (linkTo) {
    return (
      <Link to={linkTo} className="group inline-block">
        {content}
      </Link>
    );
  }

  return content;
}
