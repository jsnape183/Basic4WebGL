import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from './store';
import { seedPackages } from './features/packages/packagesSlice';
import { firstPartyPackages } from './constants/firstPartyPackages';
import Routes from "./components/Routes";

export default function App() {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    dispatch(seedPackages(firstPartyPackages));
  }, [dispatch]);

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-900 text-white">
      <Routes />
    </div>
  );
}
