<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Enums\EventType;
use App\Enums\ParticipationScope;
use App\Enums\VisibilityStatus;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('events', function (Blueprint $table) {
          $table->id();
            $table->string('title');
            $table->longText('description')->nullable();
            $table->enum('status', VisibilityStatus::cases());
            $table->dateTime('starting_at');
            $table->dateTime('ending_at');
            $table->string('event_link')->nullable()->unique();
            $table->string('event_password')->nullable();
            $table->boolean('open_for_attendance');
            $table->boolean('strict_attendance');
            $table->boolean('auto_update_score')->default(true);
            $table->enum('type', EventType::cases());
            $table->enum('participation_scope', ParticipationScope::cases());
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};
