import React from 'react';

const DeveloperCredit = () => {
    const handleLinkClick = (name: string, url: string) => (e: React.MouseEvent) => {
        e.preventDefault();
        // Prompt user before opening external site
        const shouldOpen = window.confirm(`You are about to visit ${name}'s portfolio site. Do you want to continue?`);
        if (shouldOpen) {
            window.open(url, '_blank', 'noopener,noreferrer');
        }
    };

    return (
        <p className="mt-2 text-[10px] sm:text-xs opacity-60">
            Designed and built by{" "}
            <button
                onClick={handleLinkClick('Alien Dev', 'https://alien-devv.vercel.app/')}
                className="font-bold hover:text-primary transition-colors hover:underline"
            >
                Alien Dev
            </button>
            {" "}and{" "}
            <button
                onClick={handleLinkClick('Dev_OJ', 'https://devoj.vercel.app/')}
                className="font-bold hover:text-primary transition-colors hover:underline"
            >
                Dev_OJ
            </button>
        </p>
    );
};

export default DeveloperCredit;
