import { lazy } from "react";
import { Route, Routes } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ROUTES } from "@/data/navItems";

const Home = lazy(() => import("@/pages/Home"));
const PhotoBooth = lazy(() => import("@/pages/PhotoBooth"));
const ResultEdit = lazy(() => import("@/pages/ResultEdit"));
const ImageAnalysis = lazy(() => import("@/pages/ImageAnalysis"));
const FourierSpectrum = lazy(() => import("@/pages/FourierSpectrum"));
const Gallery = lazy(() => import("@/pages/Gallery"));
const NotFound = lazy(() => import("@/pages/NotFound"));

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path={ROUTES.home} element={<Home />} />
        <Route path={ROUTES.photoBooth} element={<PhotoBooth />} />
        <Route path={ROUTES.resultEdit} element={<ResultEdit />} />
        <Route path={ROUTES.imageAnalysis} element={<ImageAnalysis />} />
        <Route path={ROUTES.fourierSpectrum} element={<FourierSpectrum />} />
        <Route path={ROUTES.gallery} element={<Gallery />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
