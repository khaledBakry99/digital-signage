// API Clients - جميع الـ APIs في مكان واحد لسهولة الاستدعاء والصيانة

export { apiClient } from './client';
export type { ApiError } from './client';

// Auth API
export { authApi } from './auth.api';

// Campaign API
export { campaignApi } from './campaign.api';

// Media Asset API
export { mediaAssetApi } from './mediaAsset.api';

// Screen API
export { screenApi } from './screen.api';

// Gender AI API
export { genderAiApi } from './genderAi.api';

// Dashboard API
export { dashboardApi } from './dashboard.api';
export type { ClientDashboardStats } from './dashboard.api';

// Camera API
export { cameraApi } from './camera.api';
export type { BackendCamera, CreateCameraInput, UpdateCameraInput, CameraState } from './camera.api';
