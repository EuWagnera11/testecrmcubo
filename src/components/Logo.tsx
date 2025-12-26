import { Link } from 'react-router-dom';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  linkTo?: string;
}

export function Logo({ size = 'md', linkTo = '/dashboard' }: LogoProps) {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-xl sm:text-2xl',
    lg: 'text-2xl sm:text-3xl',
  };

  const content = (
    <span 
      className={`font-display ${sizeClasses[size]} tracking-[0.15em] transition-colors duration-300 text-foreground hover:text-accent`}
    >
      CUBO
    </span>
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
