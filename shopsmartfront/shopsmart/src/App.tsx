// import Navbar from "./components/Navbar";
// import ProductList from "./features/products/ProductList";
// import Login from "./features/auth/Login";
// import "./App.css";

// function App() {
//   const isLoginPage = window.location.pathname === "/login";

//   // Show login at both "/" and "/login"
//   // if (isLoginPage || window.location.pathname === "/") {
//   //   return <Login />;
//   // }

//   if (isLoginPage) {
//     return <Login />;
//   }
//   return (
//     <div className="app">
//       <Navbar />
//       <main className="home-page">
//         <ProductList />
//       </main>
//     </div>
//   );
// }

// export default App;

import { useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import ProductList from "./features/products/ProductList";
import Login from "./features/auth/Login";
import "./App.css";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const isLoginPage = window.location.pathname === "/login";

  useEffect(() => {
    fetch("http://localhost:8080/api/Auth/me", {
      credentials: "include",
    })
      .then((response) => {
        setIsAuthenticated(response.ok);
      })
      .catch(() => {
        setIsAuthenticated(false);
      });
  }, []);

  if (isAuthenticated === null) {
    return <p>Checking login...</p>;
  }

  if (isLoginPage || !isAuthenticated) {
    if (!isLoginPage) {
      window.history.replaceState(null, "", "/login");
    }

    return <Login />;
  }

  return (
    <div className="app">
      <Navbar />
      <main className="home-page">
        <ProductList />
      </main>
    </div>
  );
}

export default App;
