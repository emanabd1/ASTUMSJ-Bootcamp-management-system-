import axios from "axios";
const axiosInstance = axios.create({ baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api", withCredentials: true, timeout: 15000 });
axiosInstance.interceptors.request.use((config) => { const token = localStorage.getItem("token"); if (token) config.headers.Authorization = `Bearer ${token}`; return config; });
axiosInstance.interceptors.response.use(
	(response) => response,
	(error) => {
		if (!error.response) {
			error.response = { data: { message: "Unable to connect to the server. Please try again." } };
		} else if (!error.response.data?.message) {
			error.response.data = {
				...error.response.data,
				message: error.response.status >= 500
					? "The server encountered an error. Please try again."
					: "The request could not be completed.",
			};
		}
		return Promise.reject(error);
	},
);
export default axiosInstance;
