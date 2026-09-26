export const setToken = (token) => localStorage.setItem('token', token);
export const getToken = () => localStorage.getItem('token');
export const removeToken = () => localStorage.removeItem('token');

export const setUserData = (user, rol) => {
    localStorage.setItem('username', user);
    localStorage.setItem('rol', rol);
};

export const clearAuth = () => {
    removeToken();
    localStorage.removeItem('username');
    localStorage.removeItem('rol');
};

export const isAuthenticated = () => !!getToken();
