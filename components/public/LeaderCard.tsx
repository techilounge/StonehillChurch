"use client";

import React, { useState, Fragment } from "react";
import Image from "next/image";
import { Serialized } from "@/lib/data/utils";
import { Leader } from "@/types/content";
import { User, Mail, X } from "lucide-react";
import { Card, CardContent } from "@/components/shared/Card";
import { Dialog, Transition } from "@headlessui/react";

interface LeaderCardProps {
  leader: Serialized<Leader>;
}

export function LeaderCard({ leader }: LeaderCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Card className="group relative h-full hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border border-slate-100 focus-within:ring-2 focus-within:ring-stonehill-accent focus-within:ring-offset-2">
        {/* Absolute trigger button for modal */}
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer rounded-2xl focus:outline-none z-0"
          aria-label={`View details for ${leader.name}`}
        />
        
        <CardContent className="flex flex-col items-center text-center p-6 h-full">
          <div className="relative w-32 h-32 rounded-full overflow-hidden bg-slate-50 mb-4 ring-4 ring-slate-50">
            {leader.photoUrl ? (
              <Image
                src={leader.photoUrl}
                alt={leader.photoAlt || leader.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-slate-500/50">
                <User className="w-12 h-12" />
              </div>
            )}
          </div>

          <h3 className="text-xl font-bold tracking-tight text-slate-900 mb-1">
            {leader.name}
          </h3>
          <p className="text-stonehill-primary font-medium text-sm mb-4 uppercase tracking-wider">
            {leader.title}
          </p>

          {leader.bio && (
            <p className="text-slate-500 text-sm mb-6 leading-relaxed line-clamp-4">
              {leader.bio}
            </p>
          )}

          {leader.email && (
            <a
              href={`mailto:${leader.email}`}
              onClick={(e) => e.stopPropagation()}
              className="relative z-10 mt-auto inline-flex items-center justify-center w-full gap-2 px-4 py-2 bg-slate-50 hover:bg-stonehill-accent/20 text-slate-900 rounded-lg transition-colors text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stonehill-accent focus-visible:ring-offset-2"
            >
              <Mail className="w-4 h-4" />
              Contact
            </a>
          )}
        </CardContent>
      </Card>

      {/* Details Modal */}
      <Transition.Root show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-6 md:p-10">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-white p-6 sm:p-8 text-left shadow-2xl transition-all w-full max-w-2xl sm:my-8">
                  {/* Close Button */}
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="absolute right-4 top-4 rounded-md text-slate-400 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-stonehill-accent focus:ring-offset-2 transition-colors p-1"
                    aria-label="Close modal"
                  >
                    <X className="h-6 w-6" />
                  </button>

                  <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start mt-4">
                    {/* Image Column */}
                    <div className="flex flex-col items-center shrink-0">
                      <div className="relative w-36 h-36 md:w-40 md:h-40 rounded-full overflow-hidden bg-slate-50 ring-4 ring-slate-100 shadow-md">
                        {leader.photoUrl ? (
                          <Image
                            src={leader.photoUrl}
                            alt={leader.photoAlt || leader.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-slate-500/50">
                            <User className="w-16 h-16" />
                          </div>
                        )}
                      </div>

                      {leader.email && (
                        <a
                          href={`mailto:${leader.email}`}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-6 inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-50 hover:bg-stonehill-accent/20 text-slate-900 rounded-lg transition-colors text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stonehill-accent focus-visible:ring-offset-2 w-full max-w-[200px]"
                        >
                          <Mail className="w-4 h-4" />
                          Email Leader
                        </a>
                      )}
                    </div>

                    {/* Bio Column */}
                    <div className="flex-1 flex flex-col min-w-0 w-full">
                      <div className="text-center md:text-left mb-4">
                        <Dialog.Title as="h2" className="text-2xl sm:text-3xl font-display font-bold text-slate-900 leading-tight">
                          {leader.name}
                        </Dialog.Title>
                        <p className="text-stonehill-primary font-semibold text-sm sm:text-base uppercase tracking-wider mt-1">
                          {leader.title}
                        </p>
                      </div>

                      {/* Scrollable Bio */}
                      <div className="max-h-[300px] overflow-y-auto pr-2 -mr-2 text-slate-700 text-sm sm:text-base leading-relaxed space-y-4">
                        {leader.bio ? (
                          <p className="whitespace-pre-wrap text-slate-950/80 font-sans">{leader.bio}</p>
                        ) : (
                          <p className="italic text-slate-400">No biography available.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
}
