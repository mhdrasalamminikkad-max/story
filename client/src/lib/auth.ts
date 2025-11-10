export interface FakeUser {
  email: string;
}

export const fakeAuth = {
  isAuthenticated: (): boolean => {
    return localStorage.getItem("fakeAuth") === "true";
  },

  getUser: (): FakeUser | null => {
    const userStr = localStorage.getItem("fakeUser");
    return userStr ? JSON.parse(userStr) : null;
  },

  signIn: (email: string): void => {
    localStorage.setItem("fakeAuth", "true");
    localStorage.setItem("fakeUser", JSON.stringify({ email }));
  },

  signOut: (): void => {
    localStorage.removeItem("fakeAuth");
    localStorage.removeItem("fakeUser");
  },
};
