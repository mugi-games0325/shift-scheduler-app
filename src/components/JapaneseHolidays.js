// 日本の祝日判定ユーティリティ
export class JapaneseHolidays {
    static apiHolidays = null;
    static lastFetched = null;
    static isUsingFallback = false;

    // フォールバック用のハードコーディングデータ
    static fallbackHolidays = {
        2024: [
            { month: 1, day: 1, name: '元日' },
            { month: 1, day: 8, name: '成人の日' },
            { month: 2, day: 11, name: '建国記念の日' },
            { month: 2, day: 12, name: '振替休日' },
            { month: 2, day: 23, name: '天皇誕生日' },
            { month: 3, day: 20, name: '春分の日' },
            { month: 4, day: 29, name: '昭和の日' },
            { month: 5, day: 3, name: '憲法記念日' },
            { month: 5, day: 4, name: 'みどりの日' },
            { month: 5, day: 5, name: 'こどもの日' },
            { month: 5, day: 6, name: '振替休日' },
            { month: 7, day: 15, name: '海の日' },
            { month: 8, day: 11, name: '山の日' },
            { month: 8, day: 12, name: '振替休日' },
            { month: 9, day: 16, name: '敬老の日' },
            { month: 9, day: 22, name: '秋分の日' },
            { month: 9, day: 23, name: '振替休日' },
            { month: 10, day: 14, name: 'スポーツの日' },
            { month: 11, day: 3, name: '文化の日' },
            { month: 11, day: 4, name: '振替休日' },
            { month: 11, day: 23, name: '勤労感謝の日' }
        ],
        2025: [
            { month: 1, day: 1, name: '元日' },
            { month: 1, day: 13, name: '成人の日' },
            { month: 2, day: 11, name: '建国記念の日' },
            { month: 2, day: 23, name: '天皇誕生日' },
            { month: 2, day: 24, name: '振替休日' },
            { month: 3, day: 20, name: '春分の日' },
            { month: 4, day: 29, name: '昭和の日' },
            { month: 5, day: 3, name: '憲法記念日' },
            { month: 5, day: 4, name: 'みどりの日' },
            { month: 5, day: 5, name: 'こどもの日' },
            { month: 5, day: 6, name: '振替休日' },
            { month: 7, day: 21, name: '海の日' },
            { month: 8, day: 11, name: '山の日' },
            { month: 9, day: 15, name: '敬老の日' },
            { month: 9, day: 23, name: '秋分の日' },
            { month: 10, day: 13, name: 'スポーツの日' },
            { month: 11, day: 3, name: '文化の日' },
            { month: 11, day: 23, name: '勤労感謝の日' },
            { month: 11, day: 24, name: '振替休日' }
        ],
        2026: [
            { month: 1, day: 1, name: '元日' },
            { month: 1, day: 12, name: '成人の日' },
            { month: 2, day: 11, name: '建国記念の日' },
            { month: 2, day: 23, name: '天皇誕生日' },
            { month: 3, day: 21, name: '春分の日' },
            { month: 4, day: 29, name: '昭和の日' },
            { month: 5, day: 3, name: '憲法記念日' },
            { month: 5, day: 4, name: 'みどりの日' },
            { month: 5, day: 5, name: 'こどもの日' },
            { month: 7, day: 20, name: '海の日' },
            { month: 8, day: 11, name: '山の日' },
            { month: 9, day: 21, name: '敬老の日' },
            { month: 9, day: 22, name: '国民の休日' },
            { month: 9, day: 23, name: '秋分の日' },
            { month: 10, day: 12, name: 'スポーツの日' },
            { month: 11, day: 3, name: '文化の日' },
            { month: 11, day: 23, name: '勤労感謝の日' }
        ]
    };

    // APIから祝日データを取得
    static async fetchHolidays() {
        try {
            console.log('🔄 祝日APIからデータを取得中...');
            const response = await fetch('https://holidays-jp.github.io/api/v1/date.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('📥 APIから取得した生データ:', data);
            console.log('📊 APIデータのサンプル:', Object.entries(data).slice(0, 5));

            this.apiHolidays = this.parseApiData(data);
            console.log('🔍 パース後のデータ構造:', this.apiHolidays);
            console.log('📅 2025年の祝日例:', this.apiHolidays[2025]?.slice(0, 3));

            this.lastFetched = new Date();
            this.isUsingFallback = false;

            console.log('✅ 祝日データをAPIから正常に取得しました');
            return this.apiHolidays;
        } catch (error) {
            console.warn('⚠️ 祝日APIからのデータ取得に失敗しました。ハードコーディングデータを使用します。', error);
            this.isUsingFallback = true;
            this.apiHolidays = null;
            return this.fallbackHolidays;
        }
    }

    // APIデータを内部形式に変換
    static parseApiData(apiData) {
        const holidays = {};

        console.log('🔧 APIデータをパース中...');

        Object.entries(apiData).forEach(([dateStr, name]) => {
            const [year, month, day] = dateStr.split('-').map(Number);

            // デバッグ用（最初の5件のみ表示）
            if (Object.keys(holidays).length < 2 && (!holidays[year] || holidays[year].length < 3)) {
                console.log(`📝 パース例: ${dateStr} (${year}年${month}月${day}日) -> ${name}`);
            }

            if (!holidays[year]) {
                holidays[year] = [];
            }

            holidays[year].push({
                month: month,
                day: day,
                name: name
            });
        });

        // パース結果のサマリを表示
        const years = Object.keys(holidays).sort();
        console.log(`🗓️ パース完了: ${years.length}年分のデータ (${years.join(', ')})`);
        years.forEach(year => {
            console.log(`   ${year}年: ${holidays[year].length}件の祝日`);
        });

        return holidays;
    }

    // 祝日データを取得（キャッシュ機能付き）
    static async getHolidays() {
        // キャッシュが有効（1時間以内）かチェック
        const oneHour = 60 * 60 * 1000;
        if (this.apiHolidays && this.lastFetched &&
            (new Date() - this.lastFetched) < oneHour) {
            return this.apiHolidays;
        }

        // APIから取得を試行
        return await this.fetchHolidays();
    }

    // 指定した日が祝日かどうかを判定
    static async isHoliday(year, month, day) {
        const holidays = await this.getHolidays();
        const yearHolidays = holidays[year];

        if (!yearHolidays) return false;

        return yearHolidays.some(holiday =>
            holiday.month === month && holiday.day === day
        );
    }

    // 祝日名を取得
    static async getHolidayName(year, month, day) {
        const holidays = await this.getHolidays();
        const yearHolidays = holidays[year];

        if (!yearHolidays) return null;

        const holiday = yearHolidays.find(holiday =>
            holiday.month === month && holiday.day === day
        );
        return holiday ? holiday.name : null;
    }

    // 土日祝日（休業日）かどうかを判定
    static async isWeekendOrHoliday(year, month, day) {
        const date = new Date(year, month - 1, day);
        const dayOfWeek = date.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // 日曜日または土曜日

        if (isWeekend) return true;

        const isHoliday = await this.isHoliday(year, month, day);
        return isHoliday;
    }

    // 年間の祝日一覧を取得
    static async getYearHolidays(year) {
        const holidays = await this.getHolidays();
        return holidays[year] || [];
    }

    // 現在フォールバックデータを使用しているかどうか
    static isUsingFallbackData() {
        return this.isUsingFallback;
    }

    // 同期版（緊急時用）- フォールバックデータのみ
    static isHolidaySync(year, month, day) {
        // 使用中のデータソースを確認
        const holidays = this.apiHolidays || this.fallbackHolidays;
        const dataSource = this.apiHolidays ? 'API' : 'フォールバック';

        console.log(`🔧 同期版祝日判定: ${year}年${month}月${day}日 (データソース: ${dataSource})`);

        const yearHolidays = holidays[year];
        if (!yearHolidays) {
            console.log(`❌ ${year}年のデータが見つかりません (${dataSource}データ)`);
            return false;
        }

        const isHoliday = yearHolidays.some(holiday =>
            holiday.month === month && holiday.day === day
        );

        if (isHoliday) {
            const holidayName = yearHolidays.find(h => h.month === month && h.day === day)?.name;
            console.log(`🎌 祝日です: ${year}年${month}月${day}日 = ${holidayName} (${dataSource}データ)`);
        } else {
            console.log(`📅 平日です: ${year}年${month}月${day}日 (${dataSource}データ)`);
        }

        return isHoliday;
    }

    static isWeekendOrHolidaySync(year, month, day) {
        const date = new Date(year, month - 1, day);
        const dayOfWeek = date.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        console.log(`🗓️ 同期版休日判定: ${year}年${month}月${day}日 (曜日: ${dayOfWeek})`);

        if (isWeekend) {
            console.log(`📅 土日です: ${dayOfWeek === 0 ? '日曜日' : '土曜日'}`);
            return true;
        }

        const isHoliday = this.isHolidaySync(year, month, day);
        const result = isWeekend || isHoliday;

        console.log(`✅ 同期版最終判定: ${result ? '休業日' : '平日'}`);
        return result;
    }
}