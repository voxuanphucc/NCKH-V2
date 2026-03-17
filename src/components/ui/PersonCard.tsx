import React from 'react';
import { UserIcon, HeartIcon, CalendarIcon } from 'lucide-react';
import type { PersonGraph, Person } from '../../types/person';
import { formatShortDate } from '../../utils/formatDate';
import { getDefaultAvatar } from '../../utils/getDefaultAvatar';
interface PersonCardProps {
  person: PersonGraph | Person;
  isSelected?: boolean;
  isRoot?: boolean;
  onClick?: () => void;
  compact?: boolean;
}
export function PersonCard({
  person,
  isSelected,
  isRoot,
  onClick,
  compact
}: PersonCardProps) {
  const isMale = person.gender === 'MALE';
  const isDeceased = 'dateOfDeath' in person && person.dateOfDeath;
  const birthDate = formatShortDate(person.dateOfBirth);
  const deathDate =
  'dateOfDeath' in person ? formatShortDate(person.dateOfDeath) : null;
  const avatarUrl = person.avatarUrl || getDefaultAvatar(person.gender, person.dateOfBirth);
  if (compact) {
    return (
      <button
        onClick={onClick}
        className={`
          flex items-center gap-3 px-3 py-2 rounded-xl transition-all w-full text-left
          ${isSelected ? 'bg-heritage-gold/10 ring-1 ring-heritage-gold/30' : 'hover:bg-warm-50'}
        `}>
        
        <div
          className={`
          w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
          ${isMale ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'}
          ${isDeceased ? 'opacity-60' : ''}
        `}>
          
          <img
            src={avatarUrl}
            alt=""
            className="w-8 h-8 rounded-full object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <p
            className={`text-sm font-medium truncate ${isDeceased ? 'text-warm-400' : 'text-warm-800'}`}>
            
            {person.fullName || `${person.lastName} ${person.firstName}`}
          </p>
          {birthDate &&
          <p className="text-xs text-warm-400 truncate">{birthDate}</p>
          }
        </div>
      </button>);

  }
  return (
    <button
      onClick={onClick}
      className={`
        relative bg-white rounded-2xl border-2 p-4 transition-all text-left w-full
        ${isSelected ? 'border-heritage-gold shadow-lg shadow-heritage-gold/10' : 'border-warm-200/60 hover:border-warm-300 hover:shadow-md'}
        ${isRoot ? 'ring-2 ring-heritage-gold/20' : ''}
        ${isDeceased ? 'opacity-75' : ''}
      `}>
      
      {isRoot &&
      <div className="absolute -top-2.5 left-4 px-2 py-0.5 bg-heritage-gold text-white text-[10px] font-bold rounded-md uppercase tracking-wider">
          Gốc
        </div>
      }

      <div className="flex items-start gap-3">
        <div
          className={`
          w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
          ${isMale ? 'bg-blue-50 text-blue-500' : 'bg-pink-50 text-pink-500'}
        `}>
          
          <img
            src={avatarUrl}
            alt=""
            className="w-12 h-12 rounded-xl object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="font-heading text-base font-semibold text-warm-800 truncate">
            {person.fullName || `${person.lastName} ${person.firstName}`}
          </h4>
          <p className="text-xs text-warm-400 mt-0.5">
            {isMale ? 'Nam' : 'Nữ'}
            {'generation' in person && person.generation !== undefined &&
            <span> · Đời {person.generation + 1}</span>
            }
          </p>
        </div>
      </div>

      {(birthDate || deathDate) &&
      <div className="mt-3 pt-3 border-t border-warm-100 space-y-1">
          {birthDate &&
        <div className="flex items-center gap-2 text-xs text-warm-500">
              <CalendarIcon className="w-3 h-3" />
              <span>Sinh: {birthDate}</span>
            </div>
        }
          {deathDate &&
        <div className="flex items-center gap-2 text-xs text-warm-400">
              <HeartIcon className="w-3 h-3" />
              <span>Mất: {deathDate}</span>
            </div>
        }
        </div>
      }
    </button>);

}