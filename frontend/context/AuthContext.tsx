import React, { createContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
    user: any; // Define your user type
    login: (credentials: { username: string; password: string }) => Promise<void>;
    register: (userDetails: { username: string; password: string }) => Promise<void>;
    logout: () => void;
    isLoggedIn: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<any>(null);
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            // Logic to fetch user data using token
            setUser({}); // Set user based on token
            setIsLoggedIn(true);
        }
    }, []);

    const login = async (credentials: { username: string; password: string }) => {
        // Call your login API
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
        });

        const data = await response.json();
        if (data.token) {
            localStorage.setItem('token', data.token);
            setUser(data.user); // Adjust according to your API response
            setIsLoggedIn(true);
        }
    };

    const register = async (userDetails: { username: string; password: string }) => {
        // Call your register API
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userDetails),
        });

        const data = await response.json();
        // Handle registration response, perhaps log the user in
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        setIsLoggedIn(false);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, isLoggedIn }}>
            {children}
        </AuthContext.Provider>
    );
};
