/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: { extend: {
    colors: {
      blue:   { 50:'#EEF5FD',100:'#D9E9FB',200:'#B6D3F6',300:'#8FBCF0',400:'#6BA7E8',
                500:'#4A90E2',600:'#3B7AD0',700:'#3063AE',800:'#2A5390',900:'#244673' },
      purple: { 50:'#F4EFFB',100:'#E7DCF7',200:'#D0BCEF',300:'#B89AE6',400:'#A37EDD',
                500:'#9061D9',600:'#7C4FC4',700:'#6740A6',800:'#543588',900:'#432B6B' },
      spark:  { light:'#FCD34D', DEFAULT:'#FBBF24', deep:'#F59E0B' },
      circuit:{ cyan:'#22D3EE', pink:'#EC4899' },
      indigo: { DEFAULT:'#2E3A8C', deep:'#283593', ink:'#1E2A6B' },
      cream:  '#F5F4F2',
    },
    fontFamily: { display:['"Baloo 2"','sans-serif'], body:['Nunito','sans-serif'] },
    backgroundImage: {
      brand:'linear-gradient(135deg,#4A90E2,#9061D9)',
      base:'linear-gradient(180deg,#2E3A8C,#1E2A6B)',
      spark:'radial-gradient(circle,#FCD34D,#FBBF24,transparent)',
    },
    borderRadius: { card:'22px', pill:'999px' },
    boxShadow: {
      soft:'0 10px 26px rgba(46,58,140,.10)',
      glow:'0 8px 30px rgba(74,144,226,.28),0 8px 30px rgba(144,97,217,.22)',
    },
  }},
  plugins: [],
}
