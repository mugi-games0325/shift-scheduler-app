# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.


# シフト作成ロジック解説書

## サマリ

このシフト作成システムは、従業員の希望と職場の運営要件を両立させる2段階のアルゴリズムです。

1. **基本シフト作成**: 必要最低人数を確保
2. **個人調整**: 各従業員の必要勤務日数を達成

優先度は「勤務日数が少ない人ほど先に配置」という公平なルールで決定されます。

## 基本ルール

### 人数制限
- **平日（月〜金）**: 最低5人推奨、4人まで許容、上限なし
- **土日（土・日）**: 最低2人、最大3人

### 個人制約
- **働けない日**: 従業員指定日は勤務対象外
- **連続勤務**: 7日以上連続勤務禁止
- **6連勤回避**: 可能な限り6日連続勤務を避ける（他に選択肢がある場合）
- **必要勤務日数**: 各従業員の設定日数を必ず達成

## シフト作成の流れ

### フェーズ1: 基本シフト作成

#### 1. 日次処理
1日目から月末まで順番に処理

#### 2. 各日の処理手順

**A. 利用可能従業員の特定**
- 働けない日に指定：除外
- 7日連続勤務中：除外
- 上記以外：利用可能

**B. 優先順位の決定**
```
優先度 = 現在勤務日数 ÷ 必要勤務日数
```
数値が小さい従業員から優先的に配置

**C. 最低人数の確保**
- 平日：4人まで配置
- 土日：2人まで配置

**D. 平日の追加配置**
- 勤務日数不足の従業員がいる場合
- 最大6人まで追加配置

#### 3. 連続勤務日数の更新
- 勤務：+1日
- 休み：0日にリセット

### フェーズ2: 個人調整

各従業員の勤務日数を目標値に調整

#### 勤務日数不足の場合
**追加可能日の条件**
1. 未勤務日である
2. 働けない日でない
3. 連続勤務制限に抵触しない
4. 人数上限を超えない

**優先順位**
- 人数の少ない日を優先
- 平日を土日より優先

#### 勤務日数過多の場合
**削除可能日の条件**
1. 勤務予定日である
2. 最低人数を下回らない

**優先順位**
- 人数の多い日から削除
- 土日より平日から削除

## 具体例

### 8月1日（金曜日）の配置例

**従業員状況**
- A：働けない日のため除外
- B：連続6日勤務（制限内）
- C：連続7日勤務のため除外
- D, E, F：問題なし

**優先度計算**
- F：4日/21日 = 0.19（最優先）
- D：6日/22日 = 0.27
- B：8日/20日 = 0.4
- E：10日/18日 = 0.56

**結果**: F, D, B, E の4人を配置

## エラー処理

### 人数不足の場合
```
警告：8月15日（土）は必要人数2人を確保できません
働ける従業員が1人しかいません
```

### 勤務日数未達の場合
```
警告：田中さんの必要勤務日数を満たせませんでした
現在: 20日 / 必要: 22日
```

## アルゴリズムの特徴

### 公平性
勤務日数による客観的な優先順位で全員を平等に扱う

### 効率性
必要最小限の人数で運営し、無駄な配置を避ける

### 柔軟性
個別の制約や要望に対応

### 確実性
必要人数と勤務日数を必ず達成

## 成功例

**入力**
```
従業員A: 必要20日, 働けない日[1,15]
従業員B: 必要22日, 働けない日[5,10,25]
従業員C: 必要18日, 働けない日[20]
```

**結果**
```
従業員A: 20日勤務（達成）
従業員B: 22日勤務（達成）
従業員C: 18日勤務（達成）

全日程で必要人数確保
連続勤務制限違反なし
```
