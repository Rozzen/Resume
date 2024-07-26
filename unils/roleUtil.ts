export const roles = {
    USER: 1,
    ADMIN: 2
  };
  
  export function checkRole(userRole: number, role: number): boolean {
    return (userRole & role) === role;
  }
  