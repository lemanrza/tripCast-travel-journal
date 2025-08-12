import { Controller, useWatch } from "react-hook-form";
import NestedImages from "./Nestedmages";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Trash2 } from "lucide-react";
import { useEffect } from "react";

function DestinationCard({ index, control, register, errors, onRemove, setValue }: any) {
    // watch status of this destination
    const status = useWatch({ control, name: `destinations.${index}.status` as const });

    useEffect(() => {
        if (status === "wishlist") {
            setValue(`destinations.${index}.datePlanned` as const, "");
            setValue(`destinations.${index}.dateVisited` as const, "");
        } else if (status === "planned") {
            setValue(`destinations.${index}.dateVisited` as const, "");
        }
    }, [status, index, setValue]);

    return (
        <Card className="shadow-sm">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Destination #{index + 1}</CardTitle>
                    <Button type="button" variant="ghost" size="icon" onClick={onRemove} aria-label="Remove destination">
                        <Trash2 className="h-5 w-5" />
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label>Name *</Label>
                    <Input placeholder="e.g., Paris" {...register(`destinations.${index}.name` as const)} />
                    {errors.destinations?.[index]?.name && (
                        <p className="text-sm text-destructive">{errors.destinations?.[index]?.name?.message as string}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label>Country *</Label>
                    <Input placeholder="e.g., France" {...register(`destinations.${index}.country` as const)} />
                </div>

                <div className="space-y-2">
                    <Label>Status *</Label>
                    <Controller
                        control={control}
                        name={`destinations.${index}.status` as const}
                        render={({ field }) => (
                            <Select value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="wishlist">Wishlist</SelectItem>
                                    <SelectItem value="planned">Planned</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    {/* 'cancelled' removed as requested */}
                                </SelectContent>
                            </Select>
                        )}
                    />
                </div>

                {/* Dates – conditional */}
                {status !== "wishlist" && (
                    <div className="space-y-2">
                        <Label>Planned Date *</Label>
                        <Input type="date" {...register(`destinations.${index}.datePlanned` as const)} />
                    </div>
                )}

                {status === "completed" && (
                    <div className="space-y-2">
                        <Label>Visited Date *</Label>
                        <Input type="date" {...register(`destinations.${index}.dateVisited` as const)} />
                    </div>
                )}

                <div className="md:col-span-2 space-y-2">
                    <Label>Notes</Label>
                    <Textarea placeholder="Anything important about this destination..." {...register(`destinations.${index}.notes` as const)} />
                </div>

                {/* Images nested array */}
                <div className="md:col-span-2">
                    <NestedImages control={control} register={register} destIndex={index} />
                </div>
            </CardContent>
        </Card>
    );
}
export default DestinationCard;