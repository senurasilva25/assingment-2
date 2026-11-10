export const courtesyItems = [
  { id: 1, type: 'phone', name: 'iphone 10', bond: 275 },
  { id: 2, type: 'phone', name: 'iphone 14', bond: 300 },
  { id: 3, type: 'phone', name: 'iphone 16', bond: 500 },
  { id: 4, type: 'phone', name: 'samsung galaxy', bond: 200 },
  { id: 5, type: 'phone', name: 'nokia', bond: 150 },
  { id: 6, type: 'phone', name: 'xiaomi', bond: 100 },
  { id: 7, type: 'charger', name: 'iphone charger', bond: 45 },
  { id: 8, type: 'charger', name: 'samsung charger', bond: 30 },
  { id: 9, type: 'charger', name: 'nokia charger', bond: 25 },
  { id: 10, type: 'charger', name: 'xiaomi', bond: 25 },
];

export function replaceCourtesyItem(items, item) {
  return [...items.filter((current) => current.type !== item.type), item];
}
