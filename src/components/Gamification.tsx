import React from 'react';
import { motion } from 'motion/react';
import { UserProfile } from '../firebase';
import { Trophy, Target, Zap, Crown, Star, Award, CheckCircle2 } from 'lucide-react';

interface GamificationProps {
    profile: UserProfile;
}

const RANKS = [
    { name: 'Beginner', minPoints: 0, icon: Star, color: 'text-gray-400', bg: 'bg-gray-400/10', border: 'border-gray-400/20' },
    { name: 'Creator', minPoints: 200, icon: Zap, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' },
    { name: 'CTR Master', minPoints: 800, icon: Target, color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20' },
    { name: 'YouTube Legend', minPoints: 2000, icon: Crown, color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/20' },
    { name: 'The Legend', minPoints: 5000, icon: Trophy, color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20' },
];

const MISSIONS = [
    { key: 'design_3_thumbnails', title: 'Design 3 Thumbnails', reward: 5, points: 10, total: 3 },
    { key: 'use_title_gen', title: 'Use AI Title Generator', reward: 3, points: 5, total: 1 },
    { key: 'try_new_style', title: 'Try a New Style', reward: 4, points: 8, total: 1 },
    { key: 'share_photo', title: 'Share a Thumbnail', reward: 6, points: 12, total: 1 },
];

export const Gamification: React.FC<GamificationProps> = ({ profile }) => {
    const currentRankIndex = RANKS.findIndex((r, i) => {
        const nextRank = RANKS[i + 1];
        return profile.points >= r.minPoints && (!nextRank || profile.points < nextRank.minPoints);
    });

    const currentRank = RANKS[currentRankIndex] || RANKS[0];
    const nextRank = RANKS[currentRankIndex + 1];
    
    const progress = nextRank 
        ? ((profile.points - currentRank.minPoints) / (nextRank.minPoints - currentRank.minPoints)) * 100 
        : 100;

    return (
        <div className="space-y-8 py-6">
            {/* Progress Bar Section */}
            <div className="relative px-4">
                <div className="flex justify-between items-end mb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="liquid-glass-icon p-1.5 rounded-lg mr-1">
                                <currentRank.icon className={`w-5 h-5 ${currentRank.color}`} />
                            </div>
                            <h3 className={`text-xl font-black uppercase tracking-tighter ${currentRank.color}`}>
                                {currentRank.name}
                            </h3>
                        </div>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                            {profile.points} / {nextRank?.minPoints || 'MAX'} POINTS
                        </p>
                    </div>
                    {nextRank && (
                        <div className="text-right">
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">NEXT RANK</p>
                            <div className="flex items-center gap-2 justify-end">
                                <span className="text-xs font-bold text-white">{nextRank.name}</span>
                                <div className="liquid-glass-icon p-1 rounded-md">
                                    <nextRank.icon className="w-4 h-4 text-gray-600" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* The Visual Progress Bar (Inspired by COD Network) */}
                <div className="relative h-3 bg-gray-900 rounded-full overflow-hidden border border-gray-800 shadow-inner">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className={`absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-500 to-blue-600 shadow-[0_0_15px_rgba(6,182,212,0.5)]`}
                    />
                    
                    {/* Rank Markers */}
                    {RANKS.map((r, i) => {
                        const markerPos = (r.minPoints / (nextRank?.minPoints || 5000)) * 100;
                        if (markerPos > 100) return null;
                        return (
                            <div 
                                key={r.name}
                                className="absolute top-0 w-px h-full bg-white/10"
                                style={{ left: `${markerPos}%` }}
                            />
                        );
                    })}
                </div>

                {/* Rank Icons Row */}
                <div className="flex justify-between mt-4 px-1">
                    {RANKS.map((r, i) => {
                        const isReached = profile.points >= r.minPoints;
                        const Icon = r.icon;
                        return (
                            <div key={r.name} className="flex flex-col items-center gap-1">
                                <div className={`p-2 rounded-xl border transition-all liquid-glass-icon ${isReached ? `${r.bg} ${r.border} ${r.color}` : 'bg-gray-900 border-gray-800 text-gray-700'}`}>
                                    <Icon className="w-4 h-4" />
                                </div>
                                <span className={`text-[8px] font-black uppercase tracking-widest ${isReached ? 'text-white' : 'text-gray-700'}`}>
                                    {r.minPoints === 0 ? '0' : `${r.minPoints / 1000}K`}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Daily Missions */}
            <div className="px-4">
                <div className="flex items-center gap-2 mb-4">
                    <div className="liquid-glass-icon p-1.5 rounded-lg">
                        <Target className="w-4 h-4 text-emerald-400" />
                    </div>
                    <h4 className="text-xs font-black text-white uppercase tracking-widest">Daily Missions</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {MISSIONS.map(m => {
                        const userMission = profile.dailyMissions[m.key] || { count: 0, completed: false };
                        const missionProgress = (userMission.count / m.total) * 100;
                        
                        return (
                            <div key={m.key} className={`p-4 rounded-2xl border transition-all ${userMission.completed ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-gray-900/50 border-gray-800'}`}>
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h5 className={`text-xs font-bold ${userMission.completed ? 'text-emerald-400' : 'text-white'}`}>
                                            {m.title}
                                        </h5>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="flex items-center gap-1 bg-yellow-500/10 px-1.5 py-0.5 rounded-md border border-yellow-500/20">
                                                <Star className="w-2.5 h-2.5 text-yellow-500 fill-yellow-500" />
                                                <span className="text-[9px] font-black text-yellow-500">+{m.reward}</span>
                                            </div>
                                            <div className="flex items-center gap-1 bg-cyan-500/10 px-1.5 py-0.5 rounded-md border border-cyan-500/20">
                                                <Zap className="w-2.5 h-2.5 text-cyan-500 fill-cyan-500" />
                                                <span className="text-[9px] font-black text-cyan-500">+{m.points} XP</span>
                                            </div>
                                        </div>
                                    </div>
                                    {userMission.completed ? (
                                        <div className="liquid-glass-icon p-1.5 rounded-lg">
                                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                        </div>
                                    ) : (
                                        <span className="text-[10px] font-mono text-gray-500">{userMission.count}/{m.total}</span>
                                    )}
                                </div>
                                {!userMission.completed && (
                                    <div className="h-1.5 bg-black rounded-full overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${missionProgress}%` }}
                                            className="h-full bg-emerald-500"
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Streak & Stats */}
            <div className="grid grid-cols-3 gap-3 px-4">
                <div className="bg-orange-500/10 border border-orange-500/20 p-3 rounded-2xl flex flex-col items-center justify-center gap-1">
                    <div className="liquid-glass-icon p-2 rounded-xl mb-1">
                        <Zap className="w-5 h-5 text-orange-500 fill-orange-500" />
                    </div>
                    <span className="text-lg font-black text-white">{profile.streak}</span>
                    <span className="text-[8px] font-black text-orange-500 uppercase tracking-widest">Day Streak</span>
                </div>
                <div className="bg-purple-500/10 border border-purple-500/20 p-3 rounded-2xl flex flex-col items-center justify-center gap-1">
                    <div className="liquid-glass-icon p-2 rounded-xl mb-1">
                        <Award className="w-5 h-5 text-purple-500 fill-purple-500" />
                    </div>
                    <span className="text-lg font-black text-white">{profile.achievements.length}</span>
                    <span className="text-[8px] font-black text-purple-500 uppercase tracking-widest">Badges</span>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-2xl flex flex-col items-center justify-center gap-1">
                    <div className="liquid-glass-icon p-2 rounded-xl mb-1">
                        <Star className="w-5 h-5 text-blue-500 fill-blue-500" />
                    </div>
                    <span className="text-lg font-black text-white">{profile.points}</span>
                    <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest">Total XP</span>
                </div>
            </div>
        </div>
    );
};
