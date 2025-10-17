"use client";

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

export function OAuthProfessionHandler() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      // Check if profession is stored in localStorage
      const storedProfession = localStorage.getItem('oauth_profession');
      
      if (storedProfession) {
        // Update user's profession
        fetch('/api/auth/update-profession', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ profession: storedProfession }),
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            console.log('Profession updated successfully:', data.user.profession);
            // Clear the stored profession
            localStorage.removeItem('oauth_profession');
          }
        })
        .catch(error => {
          console.error('Error updating profession:', error);
        });
      }
    }
  }, [session, status]);

  return null; // This component doesn't render anything
}
