export const KERALA_DISTRICTS = [
  { value: 'thiruvananthapuram', label: 'Thiruvananthapuram', latitude: 8.5241, longitude: 76.9366 },
  { value: 'kollam', label: 'Kollam', latitude: 8.8932, longitude: 76.6141 },
  { value: 'pathanamthitta', label: 'Pathanamthitta', latitude: 9.2648, longitude: 76.7870 },
  { value: 'alappuzha', label: 'Alappuzha', latitude: 9.4981, longitude: 76.3388 },
  { value: 'kottayam', label: 'Kottayam', latitude: 9.5916, longitude: 76.5222 },
  { value: 'idukki', label: 'Idukki', latitude: 9.8497, longitude: 76.9711 },
  { value: 'ernakulam', label: 'Ernakulam', latitude: 9.9816, longitude: 76.2999 },
  { value: 'thrissur', label: 'Thrissur', latitude: 10.5276, longitude: 76.2144 },
  { value: 'palakkad', label: 'Palakkad', latitude: 10.7867, longitude: 76.6548 },
  { value: 'malappuram', label: 'Malappuram', latitude: 11.0409, longitude: 76.0810 },
  { value: 'kozhikode', label: 'Kozhikode', latitude: 11.2588, longitude: 75.7804 },
  { value: 'wayanad', label: 'Wayanad', latitude: 11.6854, longitude: 76.1320 },
  { value: 'kannur', label: 'Kannur', latitude: 11.8745, longitude: 75.3704 },
  { value: 'kasaragod', label: 'Kasaragod', latitude: 12.4996, longitude: 74.9869 },
];

export const KERALA_DISTRICT_MAP = KERALA_DISTRICTS.reduce((acc, district) => {
  acc[district.value] = district;
  return acc;
}, {});
