import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Platform,
  StatusBar,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Defs, LinearGradient, Stop, SvgXml } from 'react-native-svg';

const { width } = Dimensions.get('window');

const TOKEN = 'WrySS4WWywOf5hRW5QZdDU6TR7TU38L4cthoMRxSBz0=';
const UZUM_API_BASE = 'https://api-seller.uzum.uz/api/seller-openapi/v1';

const STATUS_TRANSLATIONS: { [key: string]: { label: string; color: string } } = {
  PROCESSING: { label: 'В обработке', color: '#38BDF8' },
  COMPLETED: { label: 'Завершен', color: '#00E599' },
  DELIVERED: { label: 'Доставлен', color: '#00E599' },
  CANCELED: { label: 'Отменен', color: '#EF4444' },
  CANCELLED: { label: 'Отменен', color: '#EF4444' },
  RETURNED: { label: 'Возврат', color: '#F59E0B' },
  PENDING: { label: 'Ожидает', color: '#FACC15' },
  TO_WITHDRAW: { label: 'К выводу', color: '#A855F7' },
  WITHDRAWN: { label: 'Выведено', color: '#64748B' },
  AWAITING_SHIPMENT: { label: 'Ожидает сборки', color: '#F59E0B' },
  DELIVERING: { label: 'В пути', color: '#38BDF8' },
  DELIVERED_TO_CUSTOMER_DELIVERY_POINT: { label: 'Готов к выдаче', color: '#34D399' },
  PAID: { label: 'Оплачен', color: '#00E599' },
};

const INITIAL_PURCHASE_PRICES: { [key: string]: number } = {
  '275QF': 1906500,
  'A27U': 2779678.8,
  'Xiaomi Mi Desktop Monitor 27" IPS, 100Hz,': 1180123,
  'Redmi G27Q 2K 320Hz ': 2596270.6,
  'X27G': 1401469,
  'cмартфон Apple iPhone 11': 3255068.7,
  'Беспроводные наушники Apple AirPods Pro': 41000,
  'Игровая мышь Logitech G102': 206547,
  'Игровой OLED монитор MSI MAG 273QP QD-OLED X24 27 дюймов 2K 240 Гц': 6331276,
  'Игровой монитор ASUS ROG Swift PG27AQWP-W 27"': 15019949.99,
  'Игровой монитор MSI MAG 345CQRF 34" Ultrawide UWQHD 180Hz ': 2832295.2,
  'Игровой монитор Mi Curved Gaming G34WQ': 3165638,
  'Игровой монитор Xiaomi Mi Desktop Monitor 27" IPS, 180Hz, 1ms, Full HD, черный ': 1141516.2,
  'Игровой руль PXN V9 Gen2 ': 2028000,
  'Монитор 27': 1903797.7,
  'Монитор MSI MAG 255XF 300 HZ IPS': 1603779,
  'Монитор Mi 27': 1156675,
  'Монитор Xiaomi Redmi 27': 3152786,
  'Монитор Xiaomi Redmi 27" A27U, 4K IPS, P27UCA-RA': 2800372,
  'Очиститель битумных пятен и следов насекомых GRASS Antibitum': 50000,
  'Очиститель натуральной кожи Grass "Leather Cleaner", флакон 600 мл': 30000,
  'Смартфон Apple iPhone 11': 3255068.7,
  'Чернитель резины аэрозоль Tire shine, 500 мл': 25000,
};

interface DayStat {
  dateStr: string;
  dayName: string;
  totalSales: number;
}

interface Shop {
  id: string;
  title: string;
}

export default function HomeScreen() {
  const [loading, setLoading] = useState(false);
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShopId, setSelectedShopId] = useState<string>('ALL');
  const [updateStatus, setUpdateStatus] = useState('Синхронизация...');
  
  const [rawOrders, setRawOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  
  const [totalCost, setTotalCost] = useState('0');
  const [netProfit, setNetProfit] = useState('0');
  const [roi, setRoi] = useState('0%');
  const [canceledCount, setCanceledCount] = useState(0);

  const [dailyStats, setDailyStats] = useState<DayStat[]>([]);
  const [timePeriod, setTimePeriod] = useState<'today' | 'week' | 'month' | 'quarter' | 'year' | 'all'>('all');

  const [manualPrices, setManualPrices] = useState<{ [key: string]: number }>(INITIAL_PURCHASE_PRICES);
  const [usdRate, setUsdRate] = useState<number>(12850);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isShopPickerVisible, setIsShopPickerVisible] = useState(false);
  
  // Сканер и Этикетки
  const [isScannerVisible, setIsScannerVisible] = useState(false);
  const [scannedOrderId, setScannedOrderId] = useState('');
  const [loadingLabel, setLoadingLabel] = useState(false);
  const [svgLabelData, setSvgLabelData] = useState<string | null>(null);

  const [newPriceKey, setNewPriceKey] = useState('');
  const [newPriceValue, setNewPriceValue] = useState('');
  const [searchPriceQuery, setSearchPriceQuery] = useState('');

  useEffect(() => {
    fetch('https://cbu.uz/ru/arkhiv-kursov-valyut/json/')
      .then(res => res.json())
      .then(data => {
        const usd = data.find((item: any) => item.Ccy === 'USD');
        if (usd && usd.Rate) setUsdRate(parseFloat(usd.Rate));
      })
      .catch(() => console.log('Курс USD по умолчанию'));
  }, []);

  const getEndpointUrl = (path: string) => {
    const fullUrl = `${UZUM_API_BASE}${path}`;
    if (Platform.OS !== 'web') return fullUrl;
    const isVercel = typeof window !== 'undefined' && window.location.hostname.includes('vercel.app');
    if (isVercel) return `/api-uzum${path}`;
    return 'https://api.allorigins.win/raw?url=' + encodeURIComponent(fullUrl);
  };

  const safeJsonParse = (text: string) => {
    try {
      if (text.trim().startsWith('{') || text.trim().startsWith('[')) return JSON.parse(text);
    } catch (e) {}
    return null;
  };

  // ФУНКЦИЯ ПОЛУЧЕНИЯ ЭТИКЕТКИ SVG
  const fetchOrderLabel = async (orderId: string) => {
    if (!orderId.trim()) {
      Alert.alert('Ошибка', 'Введите или отсканируйте корректный ID заказа');
      return;
    }

    setLoadingLabel(true);
    setSvgLabelData(null);
    const path = `/fbs/order/${orderId.trim()}/labels/print?size=LARGE`;
    const url = getEndpointUrl(path);

    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': TOKEN,
          'Accept': 'image/svg+xml, application/json, text/plain, */*',
        },
      });

      if (!response.ok) {
        throw new Error(`Ошибка ${response.status}`);
      }

      const svgText = await response.text();
      if (svgText.includes('<svg')) {
        setSvgLabelData(svgText);
      } else {
        Alert.alert('Ошибка', 'Этикетка не найдена или неверный формат ответа');
      }
    } catch (e: any) {
      Alert.alert('Ошибка получения этикетки', e.message || 'Не удалось загрузить SVG');
    } finally {
      setLoadingLabel(false);
    }
  };

  const getPurchasePrice = useCallback((item: any) => {
    const title = (item.productTitle || item.skuTitle || item.title || '').toLowerCase();
    for (let k in manualPrices) {
      if (title.includes(k.toLowerCase())) return manualPrices[k];
    }
    return 0;
  }, [manualPrices]);

  const isTestOrder = useCallback((item: any) => {
    const statusKey = (item.status || '').toUpperCase();
    const isCanceled = statusKey === 'CANCELED' || statusKey === 'CANCELLED' || statusKey === 'RETURNED';
    
    if (isCanceled) return false;

    const isPendingDelivery = [
      'PROCESSING',
      'PENDING',
      'AWAITING_SHIPMENT',
      'DELIVERING',
      'DELIVERED_TO_CUSTOMER_DELIVERY_POINT',
      'DELIVERED',
      'COMPLETED',
      'PAID',
      'TO_WITHDRAW',
      'WITHDRAWN'
    ].includes(statusKey);

    if (isPendingDelivery) return false;

    const sellPrice = Number(item.sellerProfit || item.amount || item.price || 0);
    const buyPrice = getPurchasePrice(item);

    if (sellPrice < 50000) return true;
    if (buyPrice > 1000000 && sellPrice >= 10000 && sellPrice <= 100000) return true;

    return false;
  }, [getPurchasePrice]);

  const fetchFullData = async () => {
    setLoading(true);
    setUpdateStatus('Загрузка...');
    const headers = { 'Authorization': TOKEN, 'Accept': '*/*' };

    try {
      const shopsUrl = getEndpointUrl('/shops');
      const shopsRaw = await fetch(shopsUrl, { headers }).then(r => r.text());
      const shopsData = safeJsonParse(shopsRaw);
      
      let fetchedShops: Shop[] = [];
      if (shopsData && Array.isArray(shopsData) && shopsData.length > 0) {
        fetchedShops = shopsData.map((s: any) => ({
          id: String(s.id || s.shopId),
          title: s.title || s.name || `Магазин #${s.id}`,
        }));
      }
      setShops(fetchedShops);

      const shopIdsParam = selectedShopId === 'ALL' 
        ? fetchedShops.map(s => s.id).join(',') 
        : selectedShopId;

      const financeUrl = getEndpointUrl(`/finance/orders?page=0&size=100${shopIdsParam ? `&shopIds=${shopIdsParam}` : ''}`);
      const oResRaw = await fetch(financeUrl, { headers });
      const oResText = await oResRaw.text();
      const oRes = safeJsonParse(oResText) || {};
      const orders = oRes.orderItems || oRes.orders || oRes.data || [];
      
      setRawOrders(orders);
      setUpdateStatus('Обновлено ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (e) {
      setUpdateStatus('Ошибка API');
    } finally {
      setLoading(false);
    }
  };

  const generateLineChartData = useCallback((orders: any[]) => {
    const daysMap: { [key: string]: { totalSales: number; dayName: string } } = {};
    const days: string[] = [];

    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric' });
      daysMap[key] = { totalSales: 0, dayName };
      days.push(key);
    }

    orders.forEach((i) => {
      const statusKey = (i.status || '').toUpperCase();
      const isCanceled = statusKey === 'CANCELED' || statusKey === 'CANCELLED' || statusKey === 'RETURNED';
      
      if (isTestOrder(i) || isCanceled) return;

      const rawDate = i.date || i.createdDate || i.createdAt || i.orderDate;
      if (rawDate) {
        const itemDateObj = new Date(rawDate);
        if (!isNaN(itemDateObj.getTime())) {
          const itemDateStr = itemDateObj.toISOString().split('T')[0];
          if (daysMap[itemDateStr]) {
            const buy = getPurchasePrice(i);
            const profit = Number(i.sellerProfit || i.amount || i.price || 0);
            const net = profit - buy;
            daysMap[itemDateStr].totalSales += net > 0 ? net : profit;
          }
        }
      }
    });

    setDailyStats(days.map((key) => ({
      dateStr: key,
      dayName: daysMap[key].dayName,
      totalSales: Math.round(daysMap[key].totalSales),
    })));
  }, [getPurchasePrice, isTestOrder]);

  const calculateMetrics = useCallback((items: any[]) => {
    let tCost = 0;
    let tNet = 0;
    let cancelCount = 0;

    items.forEach((i) => {
      const statusKey = (i.status || '').toUpperCase();
      const isCanceled = statusKey === 'CANCELED' || statusKey === 'CANCELLED' || statusKey === 'RETURNED';

      if (isCanceled) {
        cancelCount += 1;
        return;
      }

      if (isTestOrder(i)) return;

      const buy = getPurchasePrice(i);
      const profit = Number(i.sellerProfit || i.amount || 0);
      const net = profit - buy;

      tCost += buy;
      tNet += net;
    });

    setTotalCost(Math.round(tCost).toLocaleString());
    setNetProfit(Math.round(tNet).toLocaleString());
    setCanceledCount(cancelCount);
    roiSetter(tCost > 0 ? ((tNet / tCost) * 100).toFixed(1) + '%' : '0%');
  }, [getPurchasePrice, isTestOrder]);

  const roiSetter = (val: string) => setRoi(val);

  useEffect(() => {
    const now = new Date();
    const filtered = rawOrders.filter((item) => {
      if (timePeriod === 'all') return true;
      const rawDate = item.date || item.createdDate || item.createdAt || item.orderDate;
      if (!rawDate) return true;
      const itemDate = new Date(rawDate);
      if (isNaN(itemDate.getTime())) return true;

      const diffDays = (now.getTime() - itemDate.getTime()) / (1000 * 3600 * 24);

      if (timePeriod === 'today') return itemDate.toDateString() === now.toDateString();
      if (timePeriod === 'week') return diffDays <= 7;
      if (timePeriod === 'month') return diffDays <= 30;
      if (timePeriod === 'quarter') return diffDays <= 90;
      if (timePeriod === 'year') return diffDays <= 365;

      return true;
    });

    setFilteredOrders(filtered);
    calculateMetrics(filtered);
    generateLineChartData(filtered);
  }, [timePeriod, rawOrders, manualPrices, calculateMetrics, generateLineChartData]);

  useEffect(() => {
    fetchFullData();
  }, [selectedShopId]);

  const addManualPrice = () => {
    if (!newPriceKey || !newPriceValue) return;
    setManualPrices({ ...manualPrices, [newPriceKey.trim()]: parseFloat(newPriceValue) });
    setNewPriceKey('');
    setNewPriceValue('');
  };

  const getSelectedShopTitle = () => {
    if (selectedShopId === 'ALL') return 'Все магазины';
    const found = shops.find(s => s.id === selectedShopId);
    return found ? found.title : `Магазин #${selectedShopId}`;
  };

  const filteredPricesList = useMemo(() => {
    return Object.keys(manualPrices)
      .filter(key => key.toLowerCase().includes(searchPriceQuery.toLowerCase()))
      .map(key => ({
        name: key,
        sum: manualPrices[key],
        usd: (manualPrices[key] / usdRate).toFixed(2),
      }));
  }, [manualPrices, searchPriceQuery, usdRate]);

  const chartWidth = width - 72;
  const chartHeight = 110;
  const maxSales = Math.max(...dailyStats.map((d) => d.totalSales), 100);

  const pts = dailyStats.map((item, index) => ({
    x: (index / (dailyStats.length - 1 || 1)) * chartWidth,
    y: chartHeight - (item.totalSales / maxSales) * (chartHeight - 20) - 10,
  }));

  const buildSmoothPath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return '';
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i === 0 ? i : i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  };

  const linePath = buildSmoothPath(pts);
  const fillPath = `${linePath} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`;

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#050811" />

      <View style={styles.glowShape1} />
      <View style={styles.glowShape2} />

      {/* ШАПКА */}
      <View style={styles.topHeader}>
        <View style={styles.userAvatar}>
          <Text style={styles.avatarText}>U</Text>
        </View>

        <TouchableOpacity 
          style={styles.shopSelectorBtn} 
          onPress={() => setIsShopPickerVisible(true)}
          activeOpacity={0.7}
        >
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.statusHeader}>{updateStatus}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <Text style={styles.shopSelectorText}>{getSelectedShopTitle()}</Text>
              <Text style={styles.dropdownArrow}>▾</Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconBtn} onPress={fetchFullData} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#A855F7" size="small" />
          ) : (
            <Text style={{ color: '#FFF', fontSize: 16 }}>↻</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        
        {/* КАРТОЧКА ГРАФИКА */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.shopBadge}>
              <Text style={styles.heroLabel}>Выбрано: </Text>
              <Text style={styles.shopIdText}>
                {selectedShopId === 'ALL' ? `Все (${shops.length || 4})` : `#${selectedShopId}`}
              </Text>
            </View>
            <View style={styles.badgeProfit}>
              <Text style={styles.badgeProfitText}>+ UZUM API</Text>
            </View>
          </View>

          <Text style={styles.chartHeaderTitle}>Динамика продаж</Text>

          <View style={styles.svgChartContainer}>
            <Svg width={chartWidth} height={chartHeight}>
              <Defs>
                <LinearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor="#A855F7" stopOpacity="0.5" />
                  <Stop offset="100%" stopColor="#A855F7" stopOpacity="0.0" />
                </LinearGradient>
              </Defs>

              <Path d={fillPath} fill="url(#purpleGradient)" />
              <Path d={linePath} fill="none" stroke="#B877FF" strokeWidth="3.5" />
            </Svg>
          </View>

          {/* Внедрена кнопка «Сканер» вместо «Обновить» */}
          <View style={styles.actionGrid}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => setIsScannerVisible(true)}>
              <View style={[styles.actionIconBg, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
                <Text style={[styles.actionIcon, { color: '#A855F7' }]}>📷</Text>
              </View>
              <Text style={[styles.actionLabel, { color: '#A855F7', fontWeight: '700' }]}>Сканер</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={() => setIsShopPickerVisible(true)}>
              <View style={styles.actionIconBg}><Text style={styles.actionIcon}>🛍</Text></View>
              <Text style={styles.actionLabel}>Магазины</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={() => setIsModalVisible(true)}>
              <View style={styles.actionIconBg}><Text style={styles.actionIcon}>⚙</Text></View>
              <Text style={styles.actionLabel}>Закупы</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ПЕРИОДЫ */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Период</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
          {[
            { id: 'all', label: 'Все' },
            { id: 'today', label: 'Сегодня' },
            { id: 'week', label: 'Неделя' },
            { id: 'month', label: 'Месяц' },
            { id: 'quarter', label: 'Квартал' },
            { id: 'year', label: 'Год' },
          ].map((p) => (
            <TouchableOpacity
              key={p.id}
              style={[styles.filterChip, timePeriod === p.id && styles.filterChipActive]}
              onPress={() => setTimePeriod(p.id as any)}
            >
              <Text style={[styles.filterChipText, timePeriod === p.id && styles.filterChipTextActive]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* МЕТРИКИ */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Показатели за период</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
          <View style={styles.miniCard}>
            <View style={[styles.coinIcon, { backgroundColor: 'rgba(0, 229, 153, 0.15)' }]}>
              <Text style={{ color: '#00E599', fontWeight: 'bold' }}>$</Text>
            </View>
            <View>
              <Text style={styles.miniCardTitle}>Чистая прибыль</Text>
              <Text style={[styles.miniCardVal, { color: '#00E599' }]}>{netProfit} сум</Text>
            </View>
          </View>

          <View style={styles.miniCard}>
            <View style={[styles.coinIcon, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
              <Text style={{ color: '#EF4444', fontWeight: 'bold' }}>✕</Text>
            </View>
            <View>
              <Text style={styles.miniCardTitle}>Отмены / Возвраты</Text>
              <Text style={[styles.miniCardVal, { color: '#EF4444' }]}>{canceledCount} шт.</Text>
            </View>
          </View>

          <View style={styles.miniCard}>
            <View style={[styles.coinIcon, { backgroundColor: 'rgba(255, 159, 28, 0.15)' }]}>
              <Text style={{ color: '#FF9F1C', fontWeight: 'bold' }}>📦</Text>
            </View>
            <View>
              <Text style={styles.miniCardTitle}>Закуп товаров</Text>
              <Text style={[styles.miniCardVal, { color: '#FF9F1C' }]}>{totalCost} сум</Text>
            </View>
          </View>

          <View style={styles.miniCard}>
            <View style={[styles.coinIcon, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
              <Text style={{ color: '#c084fc', fontWeight: 'bold' }}>%</Text>
            </View>
            <View>
              <Text style={styles.miniCardTitle}>Рентабельность ROI</Text>
              <Text style={[styles.miniCardVal, { color: '#c084fc' }]}>{roi}</Text>
            </View>
          </View>
        </ScrollView>

        {/* СПИСОК ТРАНЗАКЦИЙ */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Транзакции</Text>
          <Text style={styles.sectionSub}>({filteredOrders.length})</Text>
        </View>

        <View style={styles.listContainer}>
          {filteredOrders.length === 0 ? (
            <Text style={styles.emptyText}>Нет транзакций за этот период</Text>
          ) : (
            filteredOrders.map((i, idx) => {
              const buy = getPurchasePrice(i);
              const sellPrice = Number(i.sellerProfit || i.amount || i.price || 0);
              const net = sellPrice - buy;
              const displayTitle = i.productTitle || i.title || i.skuTitle || `Заказ #${i.orderId || i.id}`;

              const statusKey = (i.status || '').toUpperCase();
              const statusInfo = STATUS_TRANSLATIONS[statusKey] || { label: i.status || 'Неизвестно', color: '#94A3B8' };
              const isCanceled = statusKey === 'CANCELED' || statusKey === 'CANCELLED' || statusKey === 'RETURNED';
              const isTest = isTestOrder(i);

              const renderPriceText = () => {
                if (isCanceled) return '0 сум';
                if (isTest) return 'Тест';
                if (sellPrice > 0) return `+${Math.round(net).toLocaleString()} сум`;

                switch (statusKey) {
                  case 'PROCESSING':
                    return 'Готов к выдаче';
                  case 'DELIVERING':
                    return 'В пути';
                  case 'AWAITING_SHIPMENT':
                    return 'Ожидает сборки';
                  case 'PENDING':
                    return 'Ожидает';
                  default:
                    return 'Обработка...';
                }
              };

              return (
                <View key={idx} style={styles.cryptoItem}>
                  <View style={styles.cryptoLeft}>
                    <View style={[styles.cryptoIcon, isCanceled && { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                      <Text style={{ color: isCanceled ? '#EF4444' : '#FFF', fontSize: 11, fontWeight: 'bold' }}>
                        {displayTitle.substring(0, 2).toUpperCase()}
                      </Text>
                    </View>
                    
                    <View style={styles.titleWrapper}>
                      <Text style={styles.cryptoName} numberOfLines={2}>
                        {displayTitle}
                      </Text>
                      <Text style={[styles.cryptoSymbol, { color: isCanceled ? '#EF4444' : isTest ? '#F59E0B' : statusInfo.color }]}>
                        {isCanceled ? `Отмена (${statusInfo.label})` : isTest ? 'Тестовый заказ' : statusInfo.label}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cryptoRight}>
                    <Text style={[styles.cryptoPrice, (isCanceled || isTest || sellPrice === 0) && { color: isCanceled ? '#EF4444' : sellPrice === 0 ? statusInfo.color : '#64748B' }]}>
                      {renderPriceText()}
                    </Text>
                    {buy > 0 && !isTest && !isCanceled && (
                      <Text style={styles.cryptoChange}>Закуп: {Math.round(buy).toLocaleString()}</Text>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>

      </ScrollView>

      {/* МОДАЛЬНОЕ ОКНО СКУНЕРА QR И ПЕЧАТИ ЭТИКЕТКИ LARGE (58x40mm) */}
      <Modal visible={isScannerVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Сканер QR / Печать этикетки (58x40)</Text>
              <TouchableOpacity onPress={() => {
                setIsScannerVisible(false);
                setSvgLabelData(null);
                setScannedOrderId('');
              }}>
                <Text style={{ color: '#94a3b8', fontSize: 18 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={{ gap: 12 }}>
              <Text style={styles.modalSubTitle}>Отсканируйте QR или введите Order ID:</Text>
              
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput
                  placeholder="ID Заказа (orderId)"
                  placeholderTextColor="#64748b"
                  style={[styles.input, { flex: 1 }]}
                  value={scannedOrderId}
                  onChangeText={setScannedOrderId}
                  keyboardType="numeric"
                />
                <TouchableOpacity
                  style={[styles.modalSaveBtn, { backgroundColor: '#A855F7', justifyContent: 'center' }]}
                  onPress={() => fetchOrderLabel(scannedOrderId)}
                  disabled={loadingLabel}
                >
                  {loadingLabel ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <Text style={styles.btnTextSave}>Печать SVG</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* ОБЛАСТЬ ПРЕВЬЮ ЭТИКЕТКИ (58x40mm) */}
              <View style={styles.labelPreviewContainer}>
                {loadingLabel ? (
                  <View style={{ alignItems: 'center', gap: 8 }}>
                    <ActivityIndicator color="#A855F7" size="large" />
                    <Text style={{ color: '#94A3B8', fontSize: 12 }}>Загрузка этикетки FBS...</Text>
                  </View>
                ) : svgLabelData ? (
                  <ScrollView contentContainerStyle={styles.svgWrapper} horizontal>
                    <View style={styles.labelPaper}>
                      <SvgXml xml={svgLabelData} width="100%" height="100%" />
                    </View>
                  </ScrollView>
                ) : (
                  <View style={{ alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontSize: 28 }}>🖨️</Text>
                    <Text style={{ color: '#64748b', fontSize: 12, textAlign: 'center' }}>
                      Введите ID заказа выше для получения SVG этикетки 58x40mm (LARGE)
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* МОДАЛКА ВЫБОРА МАГАЗИНА */}
      <Modal visible={isShopPickerVisible} animationType="fade" transparent>
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setIsShopPickerVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Выберите магазин</Text>
              <TouchableOpacity onPress={() => setIsShopPickerVisible(false)}>
                <Text style={{ color: '#94a3b8', fontSize: 18 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 300 }}>
              <TouchableOpacity
                style={[
                  styles.shopSelectItem,
                  selectedShopId === 'ALL' && styles.shopSelectItemActive,
                ]}
                onPress={() => {
                  setSelectedShopId('ALL');
                  setIsShopPickerVisible(false);
                }}
              >
                <Text style={[styles.shopSelectText, selectedShopId === 'ALL' && styles.shopSelectTextActive]}>
                  🌐 Все магазины (Общая аналитика)
                </Text>
              </TouchableOpacity>

              {shops.map((shop) => (
                <TouchableOpacity
                  key={shop.id}
                  style={[
                    styles.shopSelectItem,
                    selectedShopId === shop.id && styles.shopSelectItemActive,
                  ]}
                  onPress={() => {
                    setSelectedShopId(shop.id);
                    setIsShopPickerVisible(false);
                  }}
                >
                  <Text style={[styles.shopSelectText, selectedShopId === shop.id && styles.shopSelectTextActive]}>
                    🛍 {shop.title} (#{shop.id})
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* МОДАЛКА ЦЕН ЗАКУПА */}
      <Modal visible={isModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>База цен закупа</Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <Text style={{ color: '#94a3b8', fontSize: 18 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={{ gap: 10 }}>
              <Text style={styles.modalSubTitle}>Добавить / обновить цену:</Text>
              <TextInput
                placeholder="Наименование товара / SKU"
                placeholderTextColor="#64748b"
                style={styles.input}
                value={newPriceKey}
                onChangeText={setNewPriceKey}
              />
              <TextInput
                placeholder="Сумма закупа (в сумах)"
                placeholderTextColor="#64748b"
                keyboardType="numeric"
                style={styles.input}
                value={newPriceValue}
                onChangeText={setNewPriceValue}
              />
              <TouchableOpacity style={[styles.modalSaveBtn, { backgroundColor: '#38BDF8' }]} onPress={addManualPrice}>
                <Text style={[styles.btnTextSave, { color: '#FFF' }]}>Сохранить цену</Text>
              </TouchableOpacity>

              <View style={{ marginTop: 10 }}>
                <TextInput
                  placeholder="🔍 Поиск по названию товара..."
                  placeholderTextColor="#64748b"
                  style={[styles.input, { backgroundColor: '#0D172A', borderColor: '#334155', borderWidth: 1 }]}
                  value={searchPriceQuery}
                  onChangeText={setSearchPriceQuery}
                />
              </View>

              <View style={styles.tableHeaderRow}>
                <Text style={[styles.tableHeaderText, { flex: 2 }]}>Товар</Text>
                <Text style={[styles.tableHeaderText, { flex: 1.2, textAlign: 'right' }]}>Сум (UZS)</Text>
                <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>Доллар ($)</Text>
              </View>

              <ScrollView style={{ maxHeight: 220 }}>
                {filteredPricesList.length === 0 ? (
                  <Text style={{ color: '#64748b', textAlign: 'center', paddingVertical: 15, fontSize: 12 }}>
                    Ничего не найдено
                  </Text>
                ) : (
                  filteredPricesList.map((item, i) => (
                    <View key={i} style={styles.tableRow}>
                      <Text style={[styles.tableCellText, { flex: 2, color: '#FFF' }]} numberOfLines={2}>
                        {item.name}
                      </Text>
                      <Text style={[styles.tableCellText, { flex: 1.2, color: '#FF9F1C', textAlign: 'right' }]}>
                        {Math.round(item.sum).toLocaleString()}
                      </Text>
                      <Text style={[styles.tableCellText, { flex: 1, color: '#00E599', textAlign: 'right', fontWeight: 'bold' }]}>
                        ${item.usd}
                      </Text>
                    </View>
                  ))
                )}
              </ScrollView>

              <View style={styles.usdRateFooter}>
                <Text style={styles.usdRateText}>Курс ЦБ РУз (USD):</Text>
                <Text style={styles.usdRateValue}>{usdRate.toLocaleString()} сум / 1$</Text>
              </View>

            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: '#050811' },
  glowShape1: {
    position: 'absolute', top: -40, right: -50, width: 220, height: 220, borderRadius: 110,
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
  },
  glowShape2: {
    position: 'absolute', top: 180, left: -80, width: 260, height: 260, borderRadius: 130,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
  },
  topHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 12,
  },
  userAvatar: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: '#1E293B',
    borderWidth: 1, borderColor: '#334155', justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: '#A855F7', fontWeight: 'bold', fontSize: 16 },
  statusHeader: { color: '#64748B', fontSize: 11, fontWeight: '500' },
  shopSelectorBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)', paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 16, borderWidth: 1, borderColor: 'rgba(168, 85, 247, 0.2)',
  },
  shopSelectorText: { color: '#A855F7', fontSize: 13, fontWeight: '700' },
  dropdownArrow: { color: '#A855F7', fontSize: 12 },
  iconBtn: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center', alignItems: 'center',
  },
  container: { flex: 1, paddingHorizontal: 16 },
  heroCard: {
    backgroundColor: 'rgba(13, 19, 34, 0.85)', borderRadius: 24, padding: 18, marginTop: 10,
    borderWidth: 1, borderColor: 'rgba(168, 85, 247, 0.25)', shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16,
  },
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  shopBadge: { flexDirection: 'row', alignItems: 'center' },
  heroLabel: { color: '#94A3B8', fontSize: 13, fontWeight: '500' },
  shopIdText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  badgeProfit: {
    backgroundColor: 'rgba(168, 85, 247, 0.15)', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  badgeProfitText: { color: '#C084FC', fontSize: 11, fontWeight: '700' },
  chartHeaderTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', marginTop: 12, marginBottom: 8 },
  svgChartContainer: {
    height: 110, marginVertical: 6, justifyContent: 'center', alignItems: 'center',
  },
  actionGrid: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 14 },
  actionBtn: { alignItems: 'center' },
  actionIconBg: {
    width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 4,
  },
  actionIcon: { color: '#94A3B8', fontSize: 16, fontWeight: 'bold' },
  actionLabel: { color: '#94A3B8', fontSize: 11, fontWeight: '500' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 20, marginBottom: 10 },
  sectionTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  sectionSub: { color: '#64748B', fontSize: 13, fontWeight: '500' },
  horizontalScroll: { marginHorizontal: -16, paddingHorizontal: 16 },
  filterChip: {
    backgroundColor: 'rgba(13, 19, 34, 0.8)', paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  filterChipActive: { backgroundColor: '#A855F7', borderColor: '#A855F7' },
  filterChipText: { color: '#94A3B8', fontSize: 12, fontWeight: '600' },
  filterChipTextActive: { color: '#FFFFFF', fontWeight: '800' },
  miniCard: {
    backgroundColor: 'rgba(13, 19, 34, 0.8)', borderRadius: 18, padding: 14, marginRight: 10,
    flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)', minWidth: 165,
  },
  coinIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  miniCardTitle: { color: '#64748B', fontSize: 11, fontWeight: '500' },
  miniCardVal: { fontSize: 13, fontWeight: '800', marginTop: 2 },
  listContainer: { gap: 8 },
  cryptoItem: {
    backgroundColor: 'rgba(13, 19, 34, 0.75)', borderRadius: 18, padding: 12,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  cryptoLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  cryptoIcon: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#1E293B',
    justifyContent: 'center', alignItems: 'center',
  },
  titleWrapper: { flex: 1, paddingRight: 6 },
  cryptoName: { color: '#FFFFFF', fontSize: 12, fontWeight: '600', lineHeight: 16 },
  cryptoSymbol: { fontSize: 10, fontWeight: '700', marginTop: 2 },
  cryptoRight: { alignItems: 'flex-end', minWidth: 85 },
  cryptoPrice: { color: '#00E599', fontSize: 12, fontWeight: '800' },
  cryptoChange: { color: '#64748B', fontSize: 10, marginTop: 2 },
  emptyText: { color: '#64748B', textAlign: 'center', paddingVertical: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#0D1322', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#1E293B' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  modalTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  modalSubTitle: { color: '#94A3B8', fontSize: 12, fontWeight: '600' },
  input: { backgroundColor: '#161F33', borderRadius: 12, padding: 12, color: '#FFF', fontSize: 13 },
  modalSaveBtn: { backgroundColor: '#A855F7', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  btnTextSave: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
  shopSelectItem: {
    padding: 14, borderRadius: 12, backgroundColor: '#161F33', marginBottom: 8,
    borderWidth: 1, borderColor: 'transparent',
  },
  shopSelectItemActive: { backgroundColor: 'rgba(168, 85, 247, 0.15)', borderColor: '#A855F7' },
  shopSelectText: { color: '#94A3B8', fontSize: 13, fontWeight: '600' },
  shopSelectTextActive: { color: '#FFF', fontWeight: '800' },
  tableHeaderRow: {
    flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 6, borderBottomWidth: 1,
    borderBottomColor: '#334155', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 6, marginTop: 4,
  },
  tableHeaderText: { color: '#94A3B8', fontSize: 11, fontWeight: '700' },
  tableRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 8, paddingHorizontal: 6, borderBottomWidth: 1, borderBottomColor: '#161F33',
  },
  tableCellText: { fontSize: 11 },
  usdRateFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.1)', borderRadius: 12, padding: 10, marginTop: 8,
    borderWidth: 1, borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  usdRateText: { color: '#38BDF8', fontSize: 11, fontWeight: '600' },
  usdRateValue: { color: '#FFF', fontSize: 12, fontWeight: '800' },
  
  // СТИЛИ ЭТИКЕТКИ 58x40
  labelPreviewContainer: {
    backgroundColor: '#050811', borderRadius: 16, minHeight: 220,
    justifyContent: 'center', alignItems: 'center', padding: 12,
    borderWidth: 1, borderColor: '#1E293B', marginTop: 6,
  },
  svgWrapper: { justifyContent: 'center', alignItems: 'center' },
  labelPaper: {
    width: 232, // Соответствует пропорции 58x40mm в px
    height: 160,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    overflow: 'hidden',
    padding: 4,
  },
});