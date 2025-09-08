const INV = {
    front_path: import.meta.env.PUBLIC_ROUTES,
    back_path: import.meta.env.PUBLIC_API_URL
}
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
    return null;
}

export { getCookie, INV };

